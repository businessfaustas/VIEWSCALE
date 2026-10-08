/**
 * Hand-written to match supabase/migrations. Regenerate with
 * `npx supabase gen types typescript --linked > lib/database.types.ts`
 * once a project is linked, if the schema grows.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Platform = "tiktok" | "reels" | "shorts";
export type Plan = "free" | "creator" | "pro";
export type AnalysisStatus = "uploading" | "processing" | "analyzing" | "complete" | "failed";

type ProfileRow = {
  id: string;
  name: string | null;
  credits: number;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
};

type AnalysisRow = {
  id: string;
  user_id: string;
  video_path: string | null;
  thumbnail_path: string | null;
  platform: Platform;
  duration: number | null;
  metadata: Json;
  performance_data: Json | null;
  frames: Json | null;
  transcript: Json | null;
  result: Json | null;
  score: number | null;
  status: AnalysisStatus;
  error: string | null;
  credit_charged: boolean;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      analyses: {
        Row: AnalysisRow;
        Insert: Partial<AnalysisRow> & { platform: Platform };
        Update: Partial<AnalysisRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_credit: { Args: { p_analysis_id: string }; Returns: number };
      refund_credit: { Args: { p_analysis_id: string }; Returns: boolean };
      set_plan_credits: {
        Args: { p_user_id: string; p_plan: Plan; p_credits: number };
        Returns: undefined;
      };
      get_shared_analysis: {
        Args: { p_slug: string };
        Returns: {
          id: string;
          platform: Platform;
          duration: number | null;
          result: Json | null;
          score: number | null;
          video_path: string | null;
          thumbnail_path: string | null;
          created_at: string;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Profile = ProfileRow;
export type Analysis = AnalysisRow;
