import { ClientChat } from "@/components/client/client-chat";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Messaggi · Workspace cliente" };

export default async function ClientMessagesPage() {
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null;

  const admin = createServiceClient();

  const [{ data: messages }, { data: projects }] = await Promise.all([
    admin
      .from("messages")
      .select(
        "id, body, sender_profile_id, sender_member_id, project_id, milestone_id, created_at"
      )
      .eq("workspace_id", session.workspaceId)
      .order("created_at", { ascending: true })
      .limit(500),
    admin
      .from("projects")
      .select("id, title")
      .eq("workspace_id", session.workspaceId)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Messaggi
        </span>
        <h1 className="font-heading text-h1 text-foreground">
          Conversazione con {layout.branding.freelanceName}
        </h1>
      </header>

      <ClientChat
        myMemberId={session.memberId}
        freelanceName={layout.branding.freelanceName}
        brandColor={layout.branding.brandColor}
        projects={projects ?? []}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
