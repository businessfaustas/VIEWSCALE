import { Suspense } from "react";

import { UserMenu } from "@/components/app/user-menu";
import { Footer } from "@/components/site/footer";
import { Navbar, type NavLink } from "@/components/site/navbar";
import { Skeleton } from "@/components/ui/skeleton";

const appLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar
        links={appLinks}
        desktopActions={
          <Suspense fallback={<Skeleton className="h-9 w-36 rounded-full" />}>
            <UserMenu />
          </Suspense>
        }
        mobileActions={
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <UserMenu variant="mobile" />
          </Suspense>
        }
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
