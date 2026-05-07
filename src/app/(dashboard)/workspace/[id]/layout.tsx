import { notFound } from "next/navigation";

import { WorkspaceHeader } from "@/components/app/workspace-header";
import { WorkspaceTabs } from "@/components/app/workspace-tabs";
import { WorkspaceRightSidebar } from "@/components/app/workspace-right-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("client_workspaces")
    .select(
      "id, client_name, client_type, client_email, client_vat, client_address, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!workspace) {
    notFound();
  }

  // Conteggio messaggi non letti scritti dal cliente (sender_member_id NOT NULL).
  // Per il freelance, i messaggi del cliente sono quelli da leggere.
  const { count: unreadFromClient } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .is("read_at", null)
    .not("sender_member_id", "is", null);

  return (
    <div className="grid gap-8">
      <WorkspaceHeader
        workspace={{
          id: workspace.id,
          client_name: workspace.client_name,
          client_type: workspace.client_type,
          client_email: workspace.client_email,
          client_vat: workspace.client_vat,
          client_address: workspace.client_address as { city?: string | null } | null,
          status: workspace.status,
        }}
      />
      <WorkspaceTabs workspaceId={workspace.id} messagesUnreadCount={unreadFromClient ?? 0} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">{children}</div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <WorkspaceRightSidebar
            workspaceId={workspace.id}
            createdAt={workspace.created_at}
          />
        </div>
      </div>
    </div>
  );
}
