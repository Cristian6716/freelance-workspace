import { ClientProjectCard } from "@/components/client/client-project-card";
import { Card, CardContent } from "@/components/ui/card";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Progetti · Workspace cliente" };

export default async function ClientProjectsPage() {
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null;

  const admin = createServiceClient();
  const { data: projects } = await admin
    .from("projects")
    .select(
      "id, title, type, status, created_at, milestones(id, status, title, order_index)"
    )
    .eq("workspace_id", session.workspaceId)
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const list = projects ?? [];
  const active = list.filter((p) => p.status === "active");
  const completed = list.filter((p) => p.status === "completed");
  const archived = list.filter((p) => p.status === "archived");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Progetti
        </span>
        <h1 className="font-heading text-h1 text-foreground">Tutti i progetti</h1>
        <p className="text-on-surface-variant">
          Quello che {layout.branding.freelanceName} sta seguendo per te.
        </p>
      </header>

      <ProjectsBlock title="Attivi" projects={active} brandColor={layout.branding.brandColor} />
      <ProjectsBlock title="Completati" projects={completed} brandColor={layout.branding.brandColor} />
      <ProjectsBlock title="Archiviati" projects={archived} brandColor={layout.branding.brandColor} />

      {list.length === 0 && (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-12 text-center">
            <p className="font-heading text-h3 text-foreground">Nessun progetto</p>
            <p className="text-sm text-on-surface-variant">
              Apparirà qui appena {layout.branding.freelanceName} ne crea uno.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectsBlock({
  title,
  projects,
  brandColor,
}: {
  title: string;
  projects: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    milestones: Array<{ id: string; status: string; title: string; order_index: number }>;
  }>;
  brandColor: string | null;
}) {
  if (projects.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-h2 text-foreground">{title}</h2>
      <div className="flex flex-col gap-4">
        {projects.map((p) => (
          <ClientProjectCard key={p.id} project={p} brandColor={brandColor} />
        ))}
      </div>
    </section>
  );
}
