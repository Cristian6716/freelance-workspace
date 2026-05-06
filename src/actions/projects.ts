"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  projectCreateSchema,
  projectUpdateSchema,
} from "@/lib/validation/schemas";
import type { Database } from "@/types/database.types";

type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type MilestoneInsert = Database["public"]["Tables"]["milestones"]["Insert"];

export type ProjectActionResult =
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

// =============================================================================
// createProjectAction — anche carica milestone dal template se template_id
// =============================================================================
export async function createProjectAction(
  _prev: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const parsed = projectCreateSchema.safeParse({
    workspace_id: formData.get("workspace_id"),
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    status: formData.get("status") || "active",
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    total_amount: formData.get("total_amount") ?? undefined,
    recurring_period: formData.get("recurring_period") || undefined,
    recurring_amount: formData.get("recurring_amount") ?? undefined,
    template_id: formData.get("template_id") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase } = await requireUser();
  const data = parsed.data;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: data.workspace_id,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      status: data.status,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      total_amount: data.total_amount ?? null,
      recurring_period: data.recurring_period ?? null,
      recurring_amount: data.recurring_amount ?? null,
      template_id: data.template_id ?? null,
    })
    .select("id")
    .single();

  if (error || !project) {
    console.error("[projects/create]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Pre-popola milestone dal template (solo per progetti deliverable)
  if (data.type === "deliverable" && data.template_id) {
    const { data: tpl, error: tplErr } = await supabase
      .from("templates")
      .select("default_milestones, default_total_amount")
      .eq("id", data.template_id)
      .single();

    if (!tplErr && tpl?.default_milestones) {
      type TemplateMilestone = {
        title: string;
        description?: string;
        default_amount_pct?: number;
      };
      const milestones = (tpl.default_milestones as TemplateMilestone[]).filter(
        (m) => typeof m?.title === "string" && m.title.length > 0
      );

      if (milestones.length > 0) {
        const total = data.total_amount ?? null;
        const rows: MilestoneInsert[] = milestones.map((m, idx) => ({
          project_id: project.id,
          title: m.title.slice(0, 200),
          description: m.description ? m.description.slice(0, 2000) : null,
          status: "todo",
          order_index: idx,
          amount:
            total !== null && typeof m.default_amount_pct === "number"
              ? Math.round(total * m.default_amount_pct * 100) / 100
              : null,
        }));
        const { error: insertMsErr } = await supabase.from("milestones").insert(rows);
        if (insertMsErr) {
          console.error(
            "[projects/create] milestones from template failed:",
            insertMsErr.code,
            insertMsErr.message
          );
          // non blocchiamo: il progetto è creato, milestone andranno aggiunte manualmente
        }
      }
    }
  }

  revalidatePath(`/workspace/${data.workspace_id}`);
  return { ok: true, id: project.id };
}

// =============================================================================
// updateProjectAction
// =============================================================================
export async function updateProjectAction(
  _prev: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  const parsed = projectUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    start_date: formData.get("start_date") || undefined,
    end_date: formData.get("end_date") || undefined,
    total_amount: formData.get("total_amount") ?? undefined,
    recurring_amount: formData.get("recurring_amount") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase } = await requireUser();
  const { id, ...rest } = parsed.data;
  const update: ProjectUpdate = {};
  if (rest.title !== undefined) update.title = rest.title;
  if (rest.description !== undefined) update.description = rest.description ?? null;
  if (rest.status !== undefined) update.status = rest.status;
  if (rest.start_date !== undefined) update.start_date = rest.start_date;
  if (rest.end_date !== undefined) update.end_date = rest.end_date;
  if (rest.total_amount !== undefined) update.total_amount = rest.total_amount;
  if (rest.recurring_amount !== undefined) update.recurring_amount = rest.recurring_amount;

  if (Object.keys(update).length === 0) {
    return { ok: true, id };
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select("workspace_id")
    .single();

  if (error || !updated) {
    console.error("[projects/update]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(`/workspace/${updated.workspace_id}`);
  revalidatePath(`/workspace/${updated.workspace_id}/projects/${id}`);
  return { ok: true, id };
}

// =============================================================================
// deleteProjectAction
// =============================================================================
export async function deleteProjectAction(
  projectId: string
): Promise<ProjectActionResult> {
  const { supabase } = await requireUser();

  const { data: project } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    console.error("[projects/delete]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (project?.workspace_id) {
    revalidatePath(`/workspace/${project.workspace_id}`);
  }
  return { ok: true, id: projectId };
}
