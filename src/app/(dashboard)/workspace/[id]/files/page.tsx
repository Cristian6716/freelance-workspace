import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { FileCard, type FileCardData } from "@/components/app/file-card";
import { FileUploader } from "@/components/app/file-uploader";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "File workspace",
};

export default async function WorkspaceFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const [{ data: rawFiles }, { data: projects }] = await Promise.all([
    supabase
      .from("files")
      .select(
        "id, filename, mime_type, size_bytes, visibility, version, project_id, created_at, projects(title)"
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .order("title"),
  ]);

  const files: FileCardData[] = (rawFiles ?? []).map((f) => ({
    id: f.id,
    filename: f.filename,
    mime_type: f.mime_type,
    size_bytes: f.size_bytes,
    visibility: f.visibility,
    version: f.version,
    project_title: (f.projects as { title: string } | null)?.title ?? null,
    created_at: f.created_at,
  }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-h3">File del workspace</h2>
      </div>

      <FileUploader workspaceId={workspaceId} projects={projects ?? []} />

      {files.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="grid place-items-center gap-2 py-10 text-center">
            <p className="font-heading text-h3 text-foreground">Nessun file ancora</p>
            <p className="text-sm text-on-surface-variant max-w-md">
              Carica documenti, immagini o video. Puoi tenerli privati o condividerli col cliente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
