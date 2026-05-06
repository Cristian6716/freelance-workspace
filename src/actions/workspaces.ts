"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  workspaceCreateSchema,
  workspaceUpdateSchema,
  type WorkspaceAddress,
} from "@/lib/validation/schemas";
import type { Database } from "@/types/database.types";

type WorkspaceUpdate = Database["public"]["Tables"]["client_workspaces"]["Update"];

export type WorkspaceActionResult =
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

function readAddress(formData: FormData): WorkspaceAddress | undefined {
  const street = (formData.get("address_street") ?? "").toString().trim();
  const city = (formData.get("address_city") ?? "").toString().trim();
  const cap = (formData.get("address_cap") ?? "").toString().trim();
  const province = (formData.get("address_province") ?? "").toString().trim();
  const country = (formData.get("address_country") ?? "").toString().trim();

  if (!street && !city && !cap && !province && !country) return undefined;
  return {
    street: street || undefined,
    city: city || undefined,
    cap: cap || undefined,
    province: province ? province.toUpperCase() : undefined,
    country: country || undefined,
  };
}

// =============================================================================
// createWorkspaceAction
// Crea un workspace. Owner identificato via client_workspaces.owner_id;
// nessuna riga workspace_members necessaria per l'owner (lo riconoscono già
// le RLS via owner_id). Il bug Batch A è stato fixato a livello di policy
// (vedi migration 20260506115034_fix_workspaces_select_returning.sql).
// =============================================================================
export async function createWorkspaceAction(
  _prev: WorkspaceActionResult | null,
  formData: FormData
): Promise<WorkspaceActionResult> {
  const parsed = workspaceCreateSchema.safeParse({
    client_name: formData.get("client_name"),
    client_type: formData.get("client_type"),
    client_email: formData.get("client_email"),
    client_phone: formData.get("client_phone"),
    client_vat: formData.get("client_vat"),
    client_sdi_code: formData.get("client_sdi_code"),
    address: readAddress(formData),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("client_workspaces")
    .insert({
      owner_id: user.id,
      client_name: parsed.data.client_name,
      client_type: parsed.data.client_type,
      client_email: parsed.data.client_email ?? null,
      client_phone: parsed.data.client_phone ?? null,
      client_vat: parsed.data.client_vat ?? null,
      client_sdi_code: parsed.data.client_sdi_code ?? null,
      client_address: parsed.data.address ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[workspaces/create]:", error?.code, error?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

// =============================================================================
// updateWorkspaceAction
// =============================================================================
export async function updateWorkspaceAction(
  workspaceId: string,
  _prev: WorkspaceActionResult | null,
  formData: FormData
): Promise<WorkspaceActionResult> {
  const parsed = workspaceUpdateSchema.safeParse({
    client_name: formData.get("client_name") || undefined,
    client_type: formData.get("client_type") || undefined,
    client_email: formData.get("client_email") || undefined,
    client_phone: formData.get("client_phone") || undefined,
    client_vat: formData.get("client_vat") || undefined,
    client_sdi_code: formData.get("client_sdi_code") || undefined,
    address: readAddress(formData),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Controlla i campi e riprova.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const { supabase } = await requireUser();

  const update: WorkspaceUpdate = {};
  if (parsed.data.client_name !== undefined) update.client_name = parsed.data.client_name;
  if (parsed.data.client_type !== undefined) update.client_type = parsed.data.client_type;
  if (parsed.data.client_email !== undefined)
    update.client_email = parsed.data.client_email ?? null;
  if (parsed.data.client_phone !== undefined)
    update.client_phone = parsed.data.client_phone ?? null;
  if (parsed.data.client_vat !== undefined) update.client_vat = parsed.data.client_vat ?? null;
  if (parsed.data.client_sdi_code !== undefined)
    update.client_sdi_code = parsed.data.client_sdi_code ?? null;
  if (parsed.data.address !== undefined) update.client_address = parsed.data.address ?? null;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;

  if (Object.keys(update).length === 0) {
    return { ok: true, id: workspaceId };
  }

  const { error } = await supabase
    .from("client_workspaces")
    .update(update)
    .eq("id", workspaceId);

  if (error) {
    console.error("[workspaces/update]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${workspaceId}`);
  return { ok: true, id: workspaceId };
}

// =============================================================================
// archiveWorkspaceAction
// Soft archive (status='archived'). Cancellazione hard non esposta da UI MVP.
// =============================================================================
export async function archiveWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("client_workspaces")
    .update({ status: "archived" })
    .eq("id", workspaceId);

  if (error) {
    console.error("[workspaces/archive]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${workspaceId}`);
  return { ok: true, id: workspaceId };
}

// =============================================================================
// unarchiveWorkspaceAction
// =============================================================================
export async function unarchiveWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("client_workspaces")
    .update({ status: "active" })
    .eq("id", workspaceId);

  if (error) {
    console.error("[workspaces/unarchive]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/workspace/${workspaceId}`);
  return { ok: true, id: workspaceId };
}
