import { Toaster } from "@/components/ui/sonner";
import { signOutAction } from "@/actions/auth";
import { getCurrentUserAndProfile } from "@/lib/supabase/auth-helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initialsFor(name?: string | null, email?: string | null) {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("");
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout placeholder per Batch A: nessuna sidebar (Batch B), solo header con
  // brand a sinistra e identità + logout a destra. Sufficiente per chiudere
  // il flusso di onboarding e validare auth + redirect.
  const { user, profile } = await getCurrentUserAndProfile();

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <header className="w-full border-b border-border bg-surface-container-low">
        <div className="max-w-[1280px] mx-auto px-gutter h-16 flex items-center justify-between">
          <span className="font-heading text-h3 text-foreground">[NOME_APP]</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-secondary">
              {profile?.full_name ?? user?.email}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-secondary-container text-on-secondary-container text-xs font-semibold">
                {initialsFor(profile?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-secondary hover:text-foreground transition-colors"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-gutter py-12">
        {children}
      </main>
      <Toaster richColors position="top-center" closeButton />
    </div>
  );
}
