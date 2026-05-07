import { ClientFileRow } from "@/components/client/client-file-row";
import { Card, CardContent } from "@/components/ui/card";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "File · Workspace cliente" };

export default async function ClientFilesPage() {
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null;

  const admin = createServiceClient();
  const { data: files } = await admin
    .from("files")
    .select(
      "id, filename, size_bytes, mime_type, visibility, created_at, project_id, projects(id, title)"
    )
    .eq("workspace_id", session.workspaceId)
    .eq("visibility", "shared")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  type FileWithProject = NonNullable<typeof files>[number];

  // Raggruppa per progetto
  const grouped = new Map<string, { projectTitle: string; items: FileWithProject[] }>();
  const NO_PROJECT = "_none_";
  for (const f of files ?? []) {
    const key = f.project_id ?? NO_PROJECT;
    const projectTitle =
      (f.projects as { id: string; title: string } | null)?.title ?? "Senza progetto";
    if (!grouped.has(key)) grouped.set(key, { projectTitle, items: [] });
    grouped.get(key)!.items.push(f);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          File condivisi
        </span>
        <h1 className="font-heading text-h1 text-foreground">File del workspace</h1>
        <p className="text-on-surface-variant">
          Solo i file condivisi da {layout.branding.freelanceName} con te.
        </p>
      </header>

      {grouped.size === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-12 text-center">
            <p className="font-heading text-h3 text-foreground">Nessun file disponibile</p>
            <p className="text-sm text-on-surface-variant">
              I file condivisi appariranno qui appena {layout.branding.freelanceName} li
              carica.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(grouped.entries()).map(([key, group]) => (
            <section key={key} className="flex flex-col gap-3">
              <h2 className="font-heading text-h3 text-foreground">{group.projectTitle}</h2>
              <ul className="grid gap-2">
                {group.items.map((f) => (
                  <li key={f.id}>
                    <ClientFileRow file={f} brandColor={layout.branding.brandColor} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
