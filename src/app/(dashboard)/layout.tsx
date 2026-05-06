import { Toaster } from "@/components/ui/sonner";
import { DashboardSidebar } from "@/components/app/dashboard-sidebar";
import { DashboardTopBar } from "@/components/app/dashboard-top-bar";
import { getCurrentUserAndProfile } from "@/lib/supabase/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();

  const sidebarUser = {
    email: user?.email ?? null,
    full_name: profile?.full_name ?? null,
    subscription_tier: profile?.subscription_tier ?? "free",
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardSidebar user={sidebarUser} />
      <div className="lg:pl-60">
        <DashboardTopBar user={sidebarUser} />
        <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>
      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}
