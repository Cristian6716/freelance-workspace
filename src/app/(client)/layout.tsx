import { redirect } from "next/navigation";

import { ClientFooter } from "@/components/client/client-footer";
import { ClientTopbar } from "@/components/client/client-topbar";
import { TouchLastSeen } from "@/components/client/touch-last-seen";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { getClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Workspace cliente",
  robots: { index: false, follow: false },
};

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getClientSession();

  // Sessione assente: questo layout serve come chrome MINIMO per le pagine
  // pubbliche del route group (/client/[token] consumer, /client/expired).
  // Le singole pagine che richiedono auth chiamano `requireClientSession()`
  // come PRIMA cosa e fanno redirect a /client/expired se manca il cookie.
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-foreground">
        <main className="flex flex-grow flex-col">{children}</main>
      </div>
    );
  }

  const data = await loadClientLayoutData(session);
  if (!data) {
    // Cookie firmato OK ma il member è stato revocato (o session.workspaceId
    // non matcha più). Forza re-auth.
    redirect("/client/expired?reason=revoked");
  }

  // Conteggio messaggi non letti del freelance (sender_member_id NULL = freelance).
  const admin = createServiceClient();
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", session.workspaceId)
    .is("read_at", null)
    .is("sender_member_id", null);
  const unreadCount = count ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-foreground">
      <ClientTopbar
        branding={data.branding}
        memberEmail={data.member.email}
        unreadCount={unreadCount}
      />
      <main className="mx-auto flex w-full max-w-[1280px] flex-grow flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
      <ClientFooter showAttribution={!data.branding.isStudioTier} />
      <TouchLastSeen />
    </div>
  );
}
