"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  milestoneCreateSchema,
  milestoneReorderSchema,
  milestoneUpdateStatusSchema,
} from "@/lib/validation/schemas";
import type { Database } from "@/types/database.types";

type MilestoneUpdate = Database["public"]["Tables"]["milestones"]["Update"];

export type MilestoneActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

const GENERIC_ERROR = "Impossibile salvare. Riprova fra qualche istante.";

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

async function getProjectWorkspace(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();
  return data?.workspace_id ?? null;
}

// =============================================================================
// createMilestoneAction
// =============================================================================
export async function createMilestoneAction(
  _prev: MilestoneActionResult | null,
  formData: FormData
): Promise<MilestoneActionResult> {
  const parsed = milestoneCreateSchema.safeParse({
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    due_date: formData.get("due_date"),
    amount: formData.get("amount") ?? undefined,
    notes_internal: formData.get("notes_internal"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase } = await requireUser();

  // Calcola order_index = max+1 sui milestone del progetto
  const { data: maxRows } = await supabase
    .from("milestones")
    .select("order_index")
    .eq("project_id", parsed.data.project_id)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (maxRows?.[0]?.order_index ?? -1) + 1;

  const { data: created, error } = await supabase
    .from("milestones")
    .insert({
      project_id: parsed.data.project_id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.due_date ?? null,
      amount: parsed.data.amount ?? null,
      notes_internal: parsed.data.notes_internal ?? null,
      order_index: nextOrder,
      status: "todo",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[milestones/create]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const wsId = await getProjectWorkspace(parsed.data.project_id);
  if (wsId) {
    revalidatePath(`/workspace/${wsId}/projects/${parsed.data.project_id}`);
  }
  return { ok: true, id: created.id };
}

// =============================================================================
// updateMilestoneStatusAction
// Aggiorna status + completed_at/approved_at coerentemente.
// =============================================================================
export async function updateMilestoneStatusAction(
  input: { id: string; status: "todo" | "in_progress" | "delivered" | "approved" }
): Promise<MilestoneActionResult> {
  const parsed = milestoneUpdateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Stato non valido." };
  }

  const { supabase } = await requireUser();

  const update: MilestoneUpdate = { status: parsed.data.status };
  const now = new Date().toISOString();
  if (parsed.data.status === "delivered") update.completed_at = now;
  if (parsed.data.status === "approved") {
    update.completed_at = update.completed_at ?? now;
    update.approved_at = now;
  }
  if (parsed.data.status === "todo" || parsed.data.status === "in_progress") {
    // Reset timestamp se torno indietro
    update.completed_at = null;
    update.approved_at = null;
  }

  const { data: updated, error } = await supabase
    .from("milestones")
    .update(update)
    .eq("id", parsed.data.id)
    .select("project_id, projects!inner(workspace_id)")
    .single();

  if (error || !updated) {
    console.error("[milestones/update-status]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const wsId = (updated.projects as { workspace_id: string } | null)?.workspace_id;
  if (wsId) {
    revalidatePath(`/workspace/${wsId}/projects/${updated.project_id}`);
  }
  return { ok: true, id: parsed.data.id };
}

// =============================================================================
// reorderMilestonesAction — drag & drop
// Salva la lista UUIDs nell'ordine nuovo, in una singola RPC su un range di
// indici negativi temporanei → poi positivi. Trick per evitare conflitti UNIQUE.
// =============================================================================
export async function reorderMilestonesAction(
  input: { project_id: string; ordered_ids: string[] }
): Promise<MilestoneActionResult> {
  const parsed = milestoneReorderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Riordinamento non valido." };
  }

  const { supabase } = await requireUser();

  // Aggiornamento sequenziale (non c'è UNIQUE su order_index, ma faccio in 2 fasi
  // per minimizzare la finestra in cui ci sono indici duplicati).
  // Fase 1: imposta order_index = -1 - i (negativi univoci)
  // Fase 2: imposta order_index = i (positivi finali)
  for (let i = 0; i < parsed.data.ordered_ids.length; i++) {
    const id = parsed.data.ordered_ids[i]!;
    const { error } = await supabase
      .from("milestones")
      .update({ order_index: -1 - i })
      .eq("id", id)
      .eq("project_id", parsed.data.project_id);
    if (error) {
      console.error("[milestones/reorder phase1]:", error.code, error.message);
      return { ok: false, error: GENERIC_ERROR };
    }
  }
  for (let i = 0; i < parsed.data.ordered_ids.length; i++) {
    const id = parsed.data.ordered_ids[i]!;
    const { error } = await supabase
      .from("milestones")
      .update({ order_index: i })
      .eq("id", id)
      .eq("project_id", parsed.data.project_id);
    if (error) {
      console.error("[milestones/reorder phase2]:", error.code, error.message);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  const wsId = await getProjectWorkspace(parsed.data.project_id);
  if (wsId) {
    revalidatePath(`/workspace/${wsId}/projects/${parsed.data.project_id}`);
  }
  return { ok: true };
}

// =============================================================================
// deleteMilestoneAction
// =============================================================================
export async function deleteMilestoneAction(
  milestoneId: string
): Promise<MilestoneActionResult> {
  const { supabase } = await requireUser();

  const { data: ms } = await supabase
    .from("milestones")
    .select("project_id, projects!inner(workspace_id)")
    .eq("id", milestoneId)
    .single();

  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);

  if (error) {
    console.error("[milestones/delete]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const wsId = (ms?.projects as { workspace_id: string } | null)?.workspace_id;
  if (wsId && ms?.project_id) {
    revalidatePath(`/workspace/${wsId}/projects/${ms.project_id}`);
  }
  return { ok: true, id: milestoneId };
}
