import type { Metadata } from "next";

import { MarkMessagesReadMount } from "@/components/app/mark-messages-read-mount";
import { WorkspaceChat } from "@/components/app/workspace-chat";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/supabase/auth-helpers";

export const metadata: Metadata = {
  title: "Messaggi workspace",
};

export default async function WorkspaceMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workspaceId } = await params;
  const { user, profile } = await getCurrentUserAndProfile();
  const supabase = await createClient();

  const [{ data: messages }, { data: projects }] = await Promise.all([
    supabase
      .from("messages")
      .select(
        "id, body, sender_profile_id, sender_member_id, project_id, milestone_id, created_at"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("projects")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .order("title"),
  ]);

  return (
    <div className="grid gap-4">
      <h2 className="font-heading text-h3">Messaggi</h2>
      <MarkMessagesReadMount workspaceId={workspaceId} />
      <WorkspaceChat
        workspaceId={workspaceId}
        ownerProfileId={user?.id ?? ""}
        ownerName={profile?.full_name ?? null}
        ownerEmail={user?.email ?? null}
        projects={projects ?? []}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
