"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clientEnv, serverEnv } from "@/lib/env";
import { sendEmail } from "@/lib/resend/send";
import { clientInviteEmail } from "@/lib/resend/templates/client-invite";
import type { Branding } from "@/lib/resend/templates/base";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { clientInviteSendSchema } from "@/lib/validation/schemas";

/**
 * Server Actions LATO FRELANCE per gestire l'invito cliente via magic link.
 * Tutte richiedono auth Supabase e che l'utente sia owner del workspace.
 *
 * Pattern centrale:
 * 1. Auth Supabase (RLS-friendly)
 * 2. Verifica ownership: lookup `client_workspaces.owner_id == user.id` (RLS lo
 *    forza già, ma esplicitiamo per chiarezza e fail-fast).
 * 3. Mutazione su `workspace_members` via RLS (già policy "owner CRUD member").
 * 4. Invio email via Resend (best-effort).
 */

export type ClientInviteResult =
  | {
      ok: true;
      inviteUrl: string;
      memberId: string;
      /** "sent" se email è stata inviata, "skipped" se Resend non configurato. */
      emailStatus: "sent" | "skipped" | "failed";
    }
  | { ok: false; error: string };

const GENERIC_ERROR = "Impossibile inviare l'invito. Riprova fra qualche istante.";
const EMAIL_REQUIRED = "Inserisci un'email cliente nel workspace prima di invitarlo.";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  return { supabase, user };
}

function buildInviteUrl(token: string): string {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/client/${token}`;
}

async function loadBranding(ownerId: string): Promise<Branding> {
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, logo_url, brand_color, subscription_tier")
    .eq("id", ownerId)
    .maybeSingle();
  return {
    freelanceName: profile?.full_name?.trim() || "Il tuo freelance",
    freelanceLogoUrl: profile?.logo_url ?? null,
    brandColor: profile?.brand_color ?? null,
    isStudioTier: profile?.subscription_tier === "studio",
  };
}

// =============================================================================
// sendClientInviteAction
// Crea (o riusa) il workspace_member di ruolo client con email = client_email
// del workspace, e invia l'email branded col magic link.
// =============================================================================
export async function sendClientInviteAction(input: {
  workspace_id: string;
  rotate_token?: boolean;
}): Promise<ClientInviteResult> {
  const parsed = clientInviteSendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Workspace non valido." };
  }

  const { supabase, user } = await requireUser();

  // Lookup workspace + email cliente (RLS-protected: solo owner vede)
  const { data: ws, error: wsErr } = await supabase
    .from("client_workspaces")
    .select("id, owner_id, client_name, client_email")
    .eq("id", parsed.data.workspace_id)
    .maybeSingle();

  if (wsErr) {
    console.error("[invites/lookup-ws]:", wsErr.code, wsErr.message);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!ws || ws.owner_id !== user.id) {
    return { ok: false, error: "Workspace non accessibile." };
  }
  if (!ws.client_email) {
    return { ok: false, error: EMAIL_REQUIRED };
  }

  const clientEmail = ws.client_email.toLowerCase();

  // Cerca o crea workspace_member role=client per quel workspace+email
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id, invite_token, accepted_at, last_seen_at")
    .eq("workspace_id", ws.id)
    .eq("email", clientEmail)
    .eq("role", "client")
    .maybeSingle();

  let memberId: string;
  let inviteToken: string;

  if (existingMember) {
    memberId = existingMember.id;
    if (parsed.data.rotate_token) {
      // Rotazione: genera nuovo token. Anche resetta accepted_at per forzare
      // riapertura del link. last_seen_at resta per analytics.
      const admin = createServiceClient();
      const { data: rotated, error: rotErr } = await admin
        .from("workspace_members")
        .update({
          invite_token: crypto.randomUUID(),
          accepted_at: null,
          invited_at: new Date().toISOString(),
        })
        .eq("id", memberId)
        .select("invite_token")
        .single();
      if (rotErr || !rotated) {
        console.error("[invites/rotate]:", rotErr?.code, rotErr?.message);
        return { ok: false, error: GENERIC_ERROR };
      }
      inviteToken = rotated.invite_token;
    } else {
      inviteToken = existingMember.invite_token;
    }
  } else {
    const { data: created, error: insErr } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: ws.id,
        email: clientEmail,
        role: "client",
        // user_id null: ospite via magic link
        // invite_token, invited_at: default DB
      })
      .select("id, invite_token")
      .single();
    if (insErr || !created) {
      console.error("[invites/create-member]:", insErr?.code, insErr?.message);
      return { ok: false, error: GENERIC_ERROR };
    }
    memberId = created.id;
    inviteToken = created.invite_token;
  }

  const inviteUrl = buildInviteUrl(inviteToken);

  // Invio email branded — best effort
  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (serverEnv().RESEND_API_KEY) {
    const branding = await loadBranding(user.id);
    const tpl = clientInviteEmail({
      branding,
      workspaceName: ws.client_name,
      inviteUrl,
      clientEmail,
      clientName: ws.client_name,
    });
    const sendResult = await sendEmail({
      to: clientEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "client_invite",
    });
    emailStatus = sendResult.ok ? "sent" : "failed";
  }

  revalidatePath(`/workspace/${ws.id}`);
  revalidatePath(`/workspace/${ws.id}/settings`);

  return {
    ok: true,
    inviteUrl,
    memberId,
    emailStatus,
  };
}

// =============================================================================
// revokeClientMemberAction
// Hard delete del workspace_member del cliente — invalida il magic link e
// qualsiasi sessione cliente attiva (la verifyClientSessionToken ritornerà
// claims OK ma il member non esiste più, e i guard server-side falliranno).
// =============================================================================
export async function revokeClientMemberAction(
  memberId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof memberId !== "string" || memberId.length === 0) {
    return { ok: false, error: "Member id mancante." };
  }
  const { supabase } = await requireUser();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, workspace_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) {
    return { ok: false, error: "Membro non trovato." };
  }

  const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
  if (error) {
    console.error("[invites/revoke]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(`/workspace/${member.workspace_id}/settings`);
  return { ok: true };
}
