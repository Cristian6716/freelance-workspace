import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientFileRow } from "@/components/client/client-file-row";
import { ClientMilestoneList } from "@/components/client/client-milestone-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDateIT, formatEUR } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/validation/schemas";

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null;

  const admin = createServiceClient();
  const { data: project } = await admin
    .from("projects")
    .select(
      "id, workspace_id, title, description, type, status, total_amount, recurring_amount, recurring_period, start_date, end_date, milestones(id, title, description, status, amount, due_date, order_index, approved_at)"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.workspace_id !== session.workspaceId) {
    notFound();
  }

  // File shared del progetto (visibility=shared, deleted_at IS NULL)
  const { data: files } = await admin
    .from("files")
    .select("id, filename, size_bytes, mime_type, visibility, created_at")
    .eq("workspace_id", session.workspaceId)
    .eq("project_id", project.id)
    .eq("visibility", "shared")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const sortedMilestones = [...(project.milestones ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );
  const totalAmount = project.total_amount ?? null;
  const completed = sortedMilestones.filter(
    (m) => m.status === "approved" || m.status === "delivered"
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb" className="text-sm text-on-surface-variant">
        <Link href="/client/projects" className="hover:text-foreground">
          Progetti
        </Link>
        <span aria-hidden="true"> · </span>
        <span className="text-foreground">{project.title}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
            {PROJECT_TYPE_LABELS[project.type as "deliverable" | "recurring"] ?? project.type}
          </Badge>
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
            {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ??
              project.status}
          </Badge>
        </div>
        <h1 className="font-heading text-h1 text-foreground">{project.title}</h1>
        {project.description && (
          <p className="max-w-3xl text-on-surface-variant">{project.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-on-surface-variant">
          {totalAmount !== null && (
            <span className="num-tabular text-foreground font-medium">
              {formatEUR(totalAmount)}
            </span>
          )}
          {project.start_date && (
            <span>Inizio {formatDateIT(project.start_date)}</span>
          )}
          {project.end_date && <span>Consegna {formatDateIT(project.end_date)}</span>}
          {sortedMilestones.length > 0 && (
            <span>
              {completed} di {sortedMilestones.length} milestone completate
            </span>
          )}
        </div>
      </header>

      {sortedMilestones.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-h2 text-foreground">Milestone</h2>
          <ClientMilestoneList
            milestones={sortedMilestones}
            brandColor={layout.branding.brandColor}
          />
        </section>
      ) : (
        <Card>
          <CardContent className="grid place-items-center gap-2 py-10 text-center">
            <p className="font-heading text-h3 text-foreground">Nessuna milestone definita</p>
            <p className="text-sm text-on-surface-variant">
              {layout.branding.freelanceName} aggiungerà le fasi a breve.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-h2 text-foreground">File condivisi</h2>
        {files && files.length > 0 ? (
          <ul className="grid gap-2">
            {files.map((f) => (
              <li key={f.id}>
                <ClientFileRow file={f} brandColor={layout.branding.brandColor} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Nessun file condiviso per questo progetto.
          </p>
        )}
      </section>
    </div>
  );
}
