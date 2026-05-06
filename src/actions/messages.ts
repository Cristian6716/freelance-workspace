"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { messageCreateSchema } from "@/lib/validation/schemas";

export type MessageActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

const GENERIC_ERROR = "Impossibile inviare. Riprova fra qualche istante.";

function zodToFieldErrors<T>(err: z.ZodError<T>): Partial<Record<string, string[]>> {
  return z.flattenError(err).fieldErrors as Partial<Record<string, string[]>>;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  return { supabase, user };
}

// =============================================================================
// sendMessageAction
//
// Per Batch B il sender è SEMPRE l'owner del workspace (la vista cliente è
// Batch C). Quindi compiliamo sender_profile_id = user.id e lasciamo
// sender_member_id NULL. La policy DB accetta entrambi i path.
// =============================================================================
export async function sendMessageAction(
  _prev: MessageActionResult | null,
  formData: FormData
): Promise<MessageActionResult> {
  const parsed = messageCreateSchema.safeParse({
    workspace_id: formData.get("workspace_id"),
    body: formData.get("body"),
    project_id: formData.get("project_id") || null,
    milestone_id: formData.get("milestone_id") || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Messaggio non valido.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();

  const { data: row, error } = await supabase
    .from("messages")
    .insert({
      workspace_id: parsed.data.workspace_id,
      sender_profile_id: user.id,
      sender_member_id: null,
      body: parsed.data.body,
      project_id: parsed.data.project_id ?? null,
      milestone_id: parsed.data.milestone_id ?? null,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[messages/send]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/messages`);
  revalidatePath(`/workspace/${parsed.data.workspace_id}`);
  return { ok: true, id: row.id };
}

// =============================================================================
// markMessagesReadAction — marca tutti i messaggi non letti del workspace
// come letti (read_at = now). Per ora non usiamo il read_at, ma la firma è qui
// pronta per Batch C.
// =============================================================================
export async function markMessagesReadAction(
  workspaceId: string
): Promise<MessageActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .is("read_at", null);

  if (error) {
    console.error("[messages/mark-read]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(`/workspace/${workspaceId}/messages`);
  return { ok: true };
}
