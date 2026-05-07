"use server";

import { redirect } from "next/navigation";

import {
  clearClientSessionCookie,
  setClientSessionCookie,
} from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";
import { clientInviteConsumeSchema } from "@/lib/validation/schemas";

/**
 * Server Actions LATO CLIENTE per consumare il magic link e gestire logout.
 * NIENTE auth Supabase: il cliente non ha mai un auth.users row.
 *
 * Sicurezza:
 * - Lookup tramite SERVICE_ROLE (bypassa RLS), ma il token UUID v4 è il guard:
 *   solo chi ha il link può consumare. Niente PII nel JWT cookie (solo memberId/wsId).
 * - Expiry: il primo accesso è sempre OK; per riaccessi successivi, last_seen_at
 *   non deve essere oltre 90 giorni indietro (allineato col cookie expiry).
 * - Niente log del token.
 */

const EXPIRY_DAYS = 90;

export type ConsumeMagicLinkResult =
  | { ok: true; workspaceId: string }
  | { ok: false; reason: "invalid" | "expired" | "revoked" };

export async function consumeMagicLinkAction(token: string): Promise<ConsumeMagicLinkResult> {
  const parsed = clientInviteConsumeSchema.safeParse({ token });
  if (!parsed.success) {
    return { ok: false, reason: "invalid" };
  }

  const admin = createServiceClient();

  const { data: member, error } = await admin
    .from("workspace_members")
    .select("id, workspace_id, role, accepted_at, last_seen_at")
    .eq("invite_token", parsed.data.token)
    .eq("role", "client")
    .maybeSingle();

  if (error) {
    console.error("[magic-link/consume lookup]:", error.code, error.message);
    return { ok: false, reason: "invalid" };
  }
  if (!member) {
    return { ok: false, reason: "invalid" };
  }

  // Expiry: solo se è già stato accettato in passato e l'ultimo accesso è
  // più vecchio di EXPIRY_DAYS. La prima volta (accepted_at NULL) è sempre OK.
  if (member.accepted_at && member.last_seen_at) {
    const lastSeenMs = new Date(member.last_seen_at).getTime();
    const ageDays = (Date.now() - lastSeenMs) / (1000 * 86400);
    if (Number.isFinite(ageDays) && ageDays > EXPIRY_DAYS) {
      return { ok: false, reason: "expired" };
    }
  }

  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("workspace_members")
    .update({
      accepted_at: member.accepted_at ?? now,
      last_seen_at: now,
    })
    .eq("id", member.id);

  if (updErr) {
    console.error("[magic-link/consume update]:", updErr.code, updErr.message);
    return { ok: false, reason: "invalid" };
  }

  await setClientSessionCookie(member.id, member.workspace_id);
  return { ok: true, workspaceId: member.workspace_id };
}

/**
 * Logout cliente: cancella il cookie di sessione e redirect alla landing.
 * Form-post action (chiamabile da `<form action={clientLogoutAction}>`).
 */
export async function clientLogoutAction(): Promise<void> {
  await clearClientSessionCookie();
  redirect("/");
}
