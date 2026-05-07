"use server";

import { revalidatePath } from "next/cache";

import { clientEnv, serverEnv } from "@/lib/env";
import { requireClientSession } from "@/lib/client-session";
import { sendEmail } from "@/lib/resend/send";
import type { Branding } from "@/lib/resend/templates/base";
import { milestoneApprovedEmail } from "@/lib/resend/templates/milestone-approved";
import { milestoneRevisionEmail } from "@/lib/resend/templates/milestone-revision";
import { newMessageEmail } from "@/lib/resend/templates/new-message";
import { createServiceClient } from "@/lib/supabase/server";
import {
  clientFileSignedUrlSchema,
  clientMessageCreateSchema,
  milestoneClientApproveSchema,
  milestoneClientUndoSchema,
  milestoneRevisionRequestSchema,
} from "@/lib/validation/schemas";

/**
 * Server Actions LATO CLIENTE.
 *
 * Sicurezza paranoia (PRD §5.6 + §1049):
 *  1. Ogni action chiama `requireClientSession()` come PRIMA cosa → redirect
 *     a /client/expired se cookie assente/invalido.
 *  2. Ogni mutazione/lettura usa SERVICE_ROLE (RLS bypass) ma SOLO dopo aver
 *     verificato manualmente che la risorsa appartenga a `session.workspaceId`.
 *  3. Le insert su `messages` valorizzano `sender_member_id = session.memberId`
 *     e `sender_profile_id = null`, così il constraint check exactly-one passa.
 *  4. Niente PII loggato. Errori loggati con `error.code` solo.
 *
 * Le notifiche email al freelance sono best-effort (skipped se Resend non
 * configurato in dev).
 */

const GENERIC_ERROR = "Operazione non riuscita. Riprova fra qualche istante.";
const UNDO_WINDOW_MS = 30 * 1000; // 30s grace period server-side per undo

type ApproveResult =
  | { ok: true; milestoneId: string; approvedAt: string }
  | { ok: false; error: string };

type RevisionResult =
  | { ok: true; milestoneId: string; messageId: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

type MessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

type SignedUrlResult =
  | { ok: true; url: string; filename: string }
  | { ok: false; error: string };

// -----------------------------------------------------------------------------
// Helper: workspace + freelance branding lookup tramite SERVICE_ROLE.
// -----------------------------------------------------------------------------
async function getWorkspaceBundle(workspaceId: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("client_workspaces")
    .select(
      "id, owner_id, client_name, client_email, profiles!client_workspaces_owner_id_fkey(id, email, full_name, logo_url, brand_color, subscription_tier)"
    )
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) {
    console.error("[client-mut/ws-bundle]:", error.code, error.message);
    return null;
  }
  if (!data) return null;
  const owner = data.profiles as
    | {
        id: string;
        email: string;
        full_name: string | null;
        logo_url: string | null;
        brand_color: string | null;
        subscription_tier: string;
      }
    | null;
  if (!owner) return null;
  const branding: Branding = {
    freelanceName: owner.full_name?.trim() || "Il tuo freelance",
    freelanceLogoUrl: owner.logo_url,
    brandColor: owner.brand_color,
    isStudioTier: owner.subscription_tier === "studio",
  };
  return {
    workspace: {
      id: data.id,
      client_name: data.client_name,
      client_email: data.client_email,
    },
    owner: { id: owner.id, email: owner.email },
    branding,
  };
}

function workspaceUrl(workspaceId: string): string {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/workspace/${workspaceId}`;
}

function formatAmountIT(amount: number | null): string | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// =============================================================================
// approveMilestoneAction
// 1-click: il client component ha già un undo window 5s lato UI. Server applica
// la mutazione subito (status='approved', approved_at=now). undoApprove deve
// arrivare entro UNDO_WINDOW_MS (30s) per essere accettato.
// =============================================================================
export async function approveMilestoneAction(input: {
  milestone_id: string;
}): Promise<ApproveResult> {
  const parsed = milestoneClientApproveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Milestone non valida." };

  const session = await requireClientSession();
  const admin = createServiceClient();

  // Lookup milestone + parent project per workspace check
  const { data: ms, error: msErr } = await admin
    .from("milestones")
    .select(
      "id, title, status, amount, project_id, projects!inner(id, title, workspace_id)"
    )
    .eq("id", parsed.data.milestone_id)
    .maybeSingle();

  if (msErr) {
    console.error("[client-mut/approve lookup]:", msErr.code, msErr.message);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!ms) return { ok: false, error: "Milestone non trovata." };

  const project = ms.projects as { id: string; title: string; workspace_id: string };
  if (project.workspace_id !== session.workspaceId) {
    // Tentativo di approvare milestone di un altro workspace.
    return { ok: false, error: "Risorsa non accessibile." };
  }
  if (ms.status !== "delivered") {
    return { ok: false, error: "Solo le milestone consegnate possono essere approvate." };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await admin
    .from("milestones")
    .update({ status: "approved", approved_at: now })
    .eq("id", ms.id)
    .select("id, approved_at, title, amount, project_id")
    .single();

  if (updErr || !updated) {
    console.error("[client-mut/approve update]:", updErr?.code, updErr?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Email notifica al freelance — best effort
  if (serverEnv().RESEND_API_KEY) {
    const bundle = await getWorkspaceBundle(session.workspaceId);
    if (bundle) {
      const tpl = milestoneApprovedEmail({
        branding: bundle.branding,
        clientName: bundle.workspace.client_name,
        workspaceName: bundle.workspace.client_name,
        projectTitle: project.title,
        milestoneTitle: ms.title,
        amountFormatted: formatAmountIT(ms.amount),
        workspaceUrl: workspaceUrl(session.workspaceId),
      });
      await sendEmail({
        to: bundle.owner.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "milestone_approved",
      });
    }
  }

  revalidatePath("/client");
  revalidatePath(`/client/projects/${ms.project_id}`);
  return { ok: true, milestoneId: ms.id, approvedAt: updated.approved_at ?? now };
}

// =============================================================================
// undoApproveMilestoneAction
// Revert "approved" → "delivered". Accettato solo se approved_at < UNDO_WINDOW_MS.
// =============================================================================
export async function undoApproveMilestoneAction(input: {
  milestone_id: string;
}): Promise<ApproveResult> {
  const parsed = milestoneClientUndoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Milestone non valida." };

  const session = await requireClientSession();
  const admin = createServiceClient();

  const { data: ms, error: msErr } = await admin
    .from("milestones")
    .select(
      "id, status, approved_at, project_id, projects!inner(workspace_id)"
    )
    .eq("id", parsed.data.milestone_id)
    .maybeSingle();

  if (msErr || !ms) return { ok: false, error: GENERIC_ERROR };
  const project = ms.projects as { workspace_id: string };
  if (project.workspace_id !== session.workspaceId) {
    return { ok: false, error: "Risorsa non accessibile." };
  }
  if (ms.status !== "approved" || !ms.approved_at) {
    return { ok: false, error: "Approvazione non più annullabile." };
  }
  const elapsed = Date.now() - new Date(ms.approved_at).getTime();
  if (elapsed > UNDO_WINDOW_MS) {
    return { ok: false, error: "Tempo per annullare scaduto." };
  }

  const { error: updErr } = await admin
    .from("milestones")
    .update({ status: "delivered", approved_at: null })
    .eq("id", ms.id);

  if (updErr) {
    console.error("[client-mut/undo-approve]:", updErr.code, updErr.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/client");
  revalidatePath(`/client/projects/${ms.project_id}`);
  return { ok: true, milestoneId: ms.id, approvedAt: "" };
}

// =============================================================================
// requestMilestoneRevisionAction
// Crea un messaggio nel workspace col commento del cliente. NON cambia stato
// milestone (resta "delivered" — il freelance vede il messaggio e gestisce).
// =============================================================================
export async function requestMilestoneRevisionAction(input: {
  milestone_id: string;
  comment: string;
}): Promise<RevisionResult> {
  const parsed = milestoneRevisionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Commento non valido.",
      fieldErrors: { comment: parsed.error.issues.map((i) => i.message) },
    };
  }

  const session = await requireClientSession();
  const admin = createServiceClient();

  const { data: ms, error: msErr } = await admin
    .from("milestones")
    .select("id, title, project_id, projects!inner(id, title, workspace_id)")
    .eq("id", parsed.data.milestone_id)
    .maybeSingle();

  if (msErr || !ms) return { ok: false, error: GENERIC_ERROR };
  const project = ms.projects as { id: string; title: string; workspace_id: string };
  if (project.workspace_id !== session.workspaceId) {
    return { ok: false, error: "Risorsa non accessibile." };
  }

  const messageBody = `🔁 Richiesta modifiche su "${ms.title}":\n\n${parsed.data.comment}`;

  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .insert({
      workspace_id: session.workspaceId,
      project_id: project.id,
      milestone_id: ms.id,
      sender_member_id: session.memberId,
      sender_profile_id: null,
      body: messageBody,
    })
    .select("id")
    .single();

  if (msgErr || !msg) {
    console.error("[client-mut/revision insert]:", msgErr?.code, msgErr?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Email al freelance — best effort
  if (serverEnv().RESEND_API_KEY) {
    const bundle = await getWorkspaceBundle(session.workspaceId);
    if (bundle) {
      const tpl = milestoneRevisionEmail({
        branding: bundle.branding,
        clientName: bundle.workspace.client_name,
        workspaceName: bundle.workspace.client_name,
        projectTitle: project.title,
        milestoneTitle: ms.title,
        comment: parsed.data.comment,
        workspaceUrl: workspaceUrl(session.workspaceId),
      });
      await sendEmail({
        to: bundle.owner.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "milestone_revision",
      });
    }
  }

  revalidatePath("/client");
  revalidatePath("/client/messages");
  revalidatePath(`/client/projects/${project.id}`);
  return { ok: true, milestoneId: ms.id, messageId: msg.id };
}

// =============================================================================
// sendClientMessageAction
// Inserisce un messaggio nella chat workspace come cliente. Notifica freelance.
// =============================================================================
export async function sendClientMessageAction(input: {
  body: string;
  project_id?: string | null;
}): Promise<MessageResult> {
  const parsed = clientMessageCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Messaggio non valido.",
      fieldErrors: parsed.error.issues.reduce(
        (acc, i) => {
          const path = String(i.path[0] ?? "body");
          (acc[path] ??= []).push(i.message);
          return acc;
        },
        {} as Record<string, string[]>
      ),
    };
  }

  const session = await requireClientSession();
  const admin = createServiceClient();

  // Se project_id specificato, verifica che appartenga al workspace
  if (parsed.data.project_id) {
    const { data: prj } = await admin
      .from("projects")
      .select("id, workspace_id")
      .eq("id", parsed.data.project_id)
      .maybeSingle();
    if (!prj || prj.workspace_id !== session.workspaceId) {
      return { ok: false, error: "Progetto non accessibile." };
    }
  }

  const { data: msg, error: insErr } = await admin
    .from("messages")
    .insert({
      workspace_id: session.workspaceId,
      project_id: parsed.data.project_id ?? null,
      sender_member_id: session.memberId,
      sender_profile_id: null,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (insErr || !msg) {
    console.error("[client-mut/message insert]:", insErr?.code, insErr?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Email best-effort al freelance
  if (serverEnv().RESEND_API_KEY) {
    const bundle = await getWorkspaceBundle(session.workspaceId);
    if (bundle) {
      const tpl = newMessageEmail({
        branding: bundle.branding,
        senderName: bundle.workspace.client_name,
        workspaceName: bundle.workspace.client_name,
        messagePreview: parsed.data.body,
        conversationUrl: `${workspaceUrl(session.workspaceId)}/messages`,
      });
      await sendEmail({
        to: bundle.owner.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "new_message_to_freelance",
      });
    }
  }

  revalidatePath("/client/messages");
  return { ok: true, messageId: msg.id };
}

// =============================================================================
// getClientSignedFileUrlAction
// Genera signed URL 1h per un file SHARED del workspace cliente. Doppio guard:
// - file.workspace_id == session.workspaceId
// - file.visibility == "shared"
// - file.deleted_at IS NULL
// =============================================================================
export async function getClientSignedFileUrlAction(input: {
  file_id: string;
}): Promise<SignedUrlResult> {
  const parsed = clientFileSignedUrlSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "File non valido." };

  const session = await requireClientSession();
  const admin = createServiceClient();

  const { data: file, error } = await admin
    .from("files")
    .select("id, workspace_id, visibility, storage_path, filename, deleted_at")
    .eq("id", parsed.data.file_id)
    .maybeSingle();

  if (error || !file) {
    console.error("[client-mut/signed-url lookup]:", error?.code, error?.message);
    return { ok: false, error: "File non disponibile." };
  }
  if (file.deleted_at) return { ok: false, error: "File non disponibile." };
  if (file.workspace_id !== session.workspaceId) {
    return { ok: false, error: "File non accessibile." };
  }
  if (file.visibility !== "shared") {
    return { ok: false, error: "File non condiviso." };
  }

  const { data: signed, error: signErr } = await admin.storage
    .from("workspace-files")
    .createSignedUrl(file.storage_path, 3600);

  if (signErr || !signed?.signedUrl) {
    console.error("[client-mut/signed-url create]:", signErr?.message);
    return { ok: false, error: "Download non disponibile, riprova." };
  }

  return { ok: true, url: signed.signedUrl, filename: file.filename };
}

// =============================================================================
// markClientMessagesReadAction
// Marca come letti tutti i messaggi del workspace cliente NON inviati dal
// cliente stesso (cioè scritti dal freelance).
// =============================================================================
export async function markClientMessagesReadAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireClientSession();
  const admin = createServiceClient();

  const { error } = await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", session.workspaceId)
    .is("read_at", null)
    .is("sender_member_id", null); // solo i messaggi del freelance (sender_profile_id valorizzato)

  if (error) {
    console.error("[client-mut/mark-read]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true };
}

// =============================================================================
// touchClientLastSeenAction
// Best-effort update del workspace_members.last_seen_at — chiamata dal layout
// (client) per refresh dell'expiry rolling. Mai throw.
// =============================================================================
export async function touchClientLastSeenAction(): Promise<void> {
  const session = await requireClientSession();
  const admin = createServiceClient();
  const { error } = await admin
    .from("workspace_members")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", session.memberId);
  if (error) {
    console.error("[client-mut/touch]:", error.code, error.message);
  }
}
