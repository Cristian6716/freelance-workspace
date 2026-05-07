import { notFound, redirect } from "next/navigation";

import { ClientInviteCard } from "@/components/app/client-invite-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Impostazioni workspace",
};

type Member = {
  id: string;
  email: string;
  role: string;
  invite_token: string;
  invited_at: string;
  accepted_at: string | null;
  last_seen_at: string | null;
};

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: ws } = await supabase
    .from("client_workspaces")
    .select("id, owner_id, client_name, client_email")
    .eq("id", id)
    .maybeSingle();

  if (!ws) notFound();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("id, email, role, invite_token, invited_at, accepted_at, last_seen_at")
    .eq("workspace_id", id)
    .eq("role", "client");

  const clientMember = (members?.[0] ?? null) as Member | null;

  const inviteUrl = clientMember
    ? `${clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/client/${clientMember.invite_token}`
    : null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-h3">Dati cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Row label="Nome cliente" value={ws.client_name} />
          <Row
            label="Email"
            value={ws.client_email ?? "Non impostata"}
            muted={!ws.client_email}
          />
        </CardContent>
      </Card>

      <div id="invite" className="scroll-mt-24">
        <ClientInviteCard
          workspaceId={ws.id}
          clientEmail={ws.client_email}
          existingMember={clientMember}
          inviteUrl={inviteUrl}
        />
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant/40 py-2 last:border-b-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className={muted ? "text-on-surface-variant italic" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
