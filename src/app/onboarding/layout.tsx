import { signOutAction } from "@/actions/auth";
import { Toaster } from "@/components/ui/sonner";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground antialiased">
      <Toaster richColors position="top-center" closeButton />
      {children}

      {/* Logout via form: Server Action, no JS richiesto. Rimane disponibile a tutti gli step. */}
      <noscript className="fixed bottom-4 right-4">
        <form action={signOutAction}>
          <button type="submit" className="text-sm underline">
            Esci
          </button>
        </form>
      </noscript>
    </div>
  );
}
