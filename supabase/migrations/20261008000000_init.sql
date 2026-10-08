-- ViewScale initial schema.
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
--
-- Security model
--   * RLS is on for every table: users can only see and change their own rows.
--   * Column privileges stop users from editing credits, plan, scores or results
--     directly. Those are written by server routes using the service role.
--   * Credit changes go through SECURITY DEFINER functions that only the
--     service role may execute, so they stay atomic and can't be called from
--     the browser.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 80),
  credits integer not null default 3 check (credits >= 0),
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profiles are created by the trigger below; users may only rename themselves.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- analyses
-- ---------------------------------------------------------------------------

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  video_path text,
  thumbnail_path text,
  platform text not null check (platform in ('tiktok', 'reels', 'shorts')),
  duration numeric(6, 2) check (duration > 0 and duration <= 181),
  -- caption, niche, goal, original file name
  metadata jsonb not null default '{}'::jsonb,
  -- optional real numbers the creator typed in: views, avgWatchPercent, likes, shares
  performance_data jsonb,
  -- [{ "t": seconds, "path": storage path }] for the extracted frames
  frames jsonb,
  -- Whisper output: { "text": string, "segments": [{ "start", "end", "text" }] }
  transcript jsonb,
  result jsonb,
  score smallint check (score between 0 and 100),
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'analyzing', 'complete', 'failed')),
  error text,
  credit_charged boolean not null default false,
  share_slug text unique check (share_slug is null or char_length(share_slug) >= 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index analyses_user_created_idx on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

create policy "Users can read their own analyses"
  on public.analyses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own analyses"
  on public.analyses for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own analyses"
  on public.analyses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own analyses"
  on public.analyses for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Users can create a row and set its inputs, and toggle sharing. Status,
-- transcript, result, score and credit fields are server-written only.
revoke insert, update on public.analyses from anon, authenticated;
grant insert (id, platform, duration, metadata, performance_data, video_path, thumbnail_path)
  on public.analyses to authenticated;
grant update (share_slug) on public.analyses to authenticated;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger analyses_touch_updated_at
  before update on public.analyses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Credits (service role only)
-- ---------------------------------------------------------------------------

-- Atomically takes one credit for an analysis and marks it as analyzing.
-- Raises 'insufficient_credits' when the user has none left.
create function public.consume_credit(p_analysis_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_charged boolean;
  v_remaining integer;
begin
  select user_id, credit_charged into v_user, v_charged
  from public.analyses
  where id = p_analysis_id
  for update;

  if not found then
    raise exception 'analysis_not_found';
  end if;

  if v_charged then
    raise exception 'already_charged';
  end if;

  update public.profiles
  set credits = credits - 1
  where id = v_user and credits > 0
  returning credits into v_remaining;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  update public.analyses
  set credit_charged = true, status = 'analyzing', error = null
  where id = p_analysis_id;

  return v_remaining;
end;
$$;

-- Gives the credit back if this analysis was charged. Safe to call twice.
create function public.refund_credit(p_analysis_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  update public.analyses
  set credit_charged = false
  where id = p_analysis_id and credit_charged
  returning user_id into v_user;

  if not found then
    return false;
  end if;

  update public.profiles set credits = credits + 1 where id = v_user;
  return true;
end;
$$;

-- Used by the Stripe webhook: sets the plan and resets the monthly allowance.
create function public.set_plan_credits(p_user_id uuid, p_plan text, p_credits integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set plan = p_plan, credits = greatest(p_credits, 0)
  where id = p_user_id;
end;
$$;

revoke execute on function public.consume_credit(uuid) from public, anon, authenticated;
revoke execute on function public.refund_credit(uuid) from public, anon, authenticated;
revoke execute on function public.set_plan_credits(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;
grant execute on function public.set_plan_credits(uuid, text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Public share links
-- ---------------------------------------------------------------------------

-- Returns one completed analysis by its exact share slug. There is no way to
-- list shared analyses, and private inputs (caption, performance data) are
-- left out.
create function public.get_shared_analysis(p_slug text)
returns table (
  id uuid,
  platform text,
  duration numeric,
  result jsonb,
  score smallint,
  video_path text,
  thumbnail_path text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.platform, a.duration, a.result, a.score, a.video_path, a.thumbnail_path, a.created_at
  from public.analyses a
  where a.share_slug = p_slug
    and a.status = 'complete'
    and char_length(p_slug) >= 16;
$$;

revoke execute on function public.get_shared_analysis(text) from public;
grant execute on function public.get_shared_analysis(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: private "videos" bucket, one folder per user
-- Layout: {user_id}/{analysis_id}/video.mp4, thumbnail.jpg, audio.wav, frames/NN.jpg
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  209715200, -- 200 MB
  array['video/mp4', 'video/quicktime', 'image/jpeg', 'audio/wav']
)
on conflict (id) do nothing;

create policy "Users can read their own video files"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload to their own video folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can replace their own video files"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own video files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
