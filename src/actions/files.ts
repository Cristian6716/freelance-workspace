"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { verifyWorkspaceFile } from "@/lib/validation/file-magic";
import {
  fileUploadMetaSchema,
  MAX_WORKSPACE_FILE_BYTES,
} from "@/lib/validation/schemas";

export type FileActionResult =
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
// uploadFileAction
//
// Path convention storage: {workspace_id}/{file_uuid}
// Versioning: stesso (workspace_id, project_id, filename) → version = max+1
// =============================================================================
export async function uploadFileAction(
  _prev: FileActionResult | null,
  formData: FormData
): Promise<FileActionResult> {
  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { ok: false, error: "Seleziona un file." };
  }

  if (fileEntry.size > MAX_WORKSPACE_FILE_BYTES) {
    return {
      ok: false,
      error: "File troppo grande (max 100 MB).",
      fieldErrors: { file: ["Massimo 100 MB"] },
    };
  }

  const projectIdRaw = formData.get("project_id");
  const meta = fileUploadMetaSchema.safeParse({
    workspace_id: formData.get("workspace_id"),
    project_id: projectIdRaw && String(projectIdRaw).length > 0 ? projectIdRaw : null,
    visibility: formData.get("visibility") || "private",
    filename: fileEntry.name,
  });
  if (!meta.success) {
    return {
      ok: false,
      error: "Metadata non validi.",
      fieldErrors: zodToFieldErrors(meta.error),
    };
  }

  // Magic-byte verification
  const verifiedMime = await verifyWorkspaceFile(fileEntry, fileEntry.type || "application/octet-stream");
  if (!verifiedMime) {
    return {
      ok: false,
      error: "Tipo file non riconosciuto o non consentito.",
      fieldErrors: { file: ["Formato non consentito"] },
    };
  }

  const { supabase, user } = await requireUser();

  // Determina version: cerca file esistenti con stesso filename + project_id (null safe)
  const matchQuery = supabase
    .from("files")
    .select("version")
    .eq("workspace_id", meta.data.workspace_id)
    .eq("filename", meta.data.filename)
    .order("version", { ascending: false })
    .limit(1);
  if (meta.data.project_id) {
    matchQuery.eq("project_id", meta.data.project_id);
  } else {
    matchQuery.is("project_id", null);
  }
  const { data: existing } = await matchQuery;
  const nextVersion = (existing?.[0]?.version ?? 0) + 1;

  // Path storage
  const fileUuid = crypto.randomUUID();
  const storagePath = `${meta.data.workspace_id}/${fileUuid}`;

  // Upload binario
  const { error: uploadErr } = await supabase.storage
    .from("workspace-files")
    .upload(storagePath, fileEntry, {
      contentType: verifiedMime,
      upsert: false,
    });
  if (uploadErr) {
    console.error("[files/upload storage]:", uploadErr.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  // Insert row in files
  const { data: row, error: insertErr } = await supabase
    .from("files")
    .insert({
      workspace_id: meta.data.workspace_id,
      project_id: meta.data.project_id ?? null,
      uploaded_by: user.id,
      filename: meta.data.filename,
      storage_path: storagePath,
      size_bytes: fileEntry.size,
      mime_type: verifiedMime,
      visibility: meta.data.visibility,
      version: nextVersion,
    })
    .select("id")
    .single();

  if (insertErr || !row) {
    // Pulizia: prova a rimuovere il blob orfano
    await supabase.storage.from("workspace-files").remove([storagePath]);
    console.error("[files/upload db]:", insertErr?.code, insertErr?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath(`/workspace/${meta.data.workspace_id}`);
  revalidatePath(`/workspace/${meta.data.workspace_id}/files`);
  return { ok: true, id: row.id };
}

// =============================================================================
// deleteFileAction — soft delete (deleted_at)
// =============================================================================
export async function deleteFileAction(
  fileId: string
): Promise<FileActionResult> {
  const { supabase } = await requireUser();

  const { data: file } = await supabase
    .from("files")
    .select("workspace_id")
    .eq("id", fileId)
    .single();

  const { error } = await supabase
    .from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", fileId);

  if (error) {
    console.error("[files/delete]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (file?.workspace_id) {
    revalidatePath(`/workspace/${file.workspace_id}/files`);
    revalidatePath(`/workspace/${file.workspace_id}`);
  }
  return { ok: true, id: fileId };
}

// =============================================================================
// getSignedFileUrlAction — restituisce URL signed expiring 1h
// =============================================================================
export async function getSignedFileUrlAction(
  fileId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { supabase } = await requireUser();

  // RLS su files: visibility=private vista solo dall'uploader; shared dai membri.
  const { data: file, error } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (error || !file) {
    return { ok: false, error: "File non trovato o non accessibile." };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("workspace-files")
    .createSignedUrl(file.storage_path, 60 * 60); // 1 ora

  if (signErr || !signed) {
    console.error("[files/signed-url]:", signErr?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true, url: signed.signedUrl };
}

// =============================================================================
// updateFileVisibilityAction
// =============================================================================
export async function updateFileVisibilityAction(
  fileId: string,
  visibility: "private" | "shared"
): Promise<FileActionResult> {
  const { supabase } = await requireUser();

  const { data: file } = await supabase
    .from("files")
    .select("workspace_id")
    .eq("id", fileId)
    .single();

  const { error } = await supabase
    .from("files")
    .update({ visibility })
    .eq("id", fileId);

  if (error) {
    console.error("[files/update-visibility]:", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (file?.workspace_id) {
    revalidatePath(`/workspace/${file.workspace_id}/files`);
  }
  return { ok: true, id: fileId };
}
