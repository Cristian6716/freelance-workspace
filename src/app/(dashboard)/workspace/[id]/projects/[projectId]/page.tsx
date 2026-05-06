import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, ArrowLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MilestoneList,
  type MilestoneItem,
} from "@/components/app/milestone-list";
import { NewMilestoneDialog } from "@/components/app/new-milestone-dialog";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDateIT, formatEUR } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  type MilestoneStatus,
} from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Progetto",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: workspaceId, projectId } = await params;

  const supabase = await createClient();
  const [{ data: project }, { data: milestonesRaw }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, workspace_id, title, description, type, status, start_date, end_date, total_amount, recurring_period, recurring_amount"
      )
      .eq("id", projectId)
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("milestones")
      .select(
        "id, title, description, status, due_date, amount, notes_internal, completed_at, approved_at, order_index"
      )
      .eq("project_id", projectId)
      .order("order_index"),
  ]);

  if (!project) {
    notFound();
  }

  const milestones: MilestoneItem[] = (milestonesRaw ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    status: m.status as MilestoneStatus,
    due_date: m.due_date,
    amount: m.amount,
    notes_internal: m.notes_internal,
    completed_at: m.completed_at,
    approved_at: m.approved_at,
  }));

  const completedCount = milestones.filter(
    (m) => m.status === "delivered" || m.status === "approved"
  ).length;
  const progressPct =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;

  const isRecurring = project.type === "recurring";

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link
          href={`/workspace/${workspaceId}`}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Torna ai progetti
        </Link>
        <ChevronRightIcon className="h-3 w-3" aria-hidden="true" />
        <span className="text-foreground truncate">{project.title}</span>
      </div>

      <Card className="bg-card">
        <CardContent className="grid gap-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {isRecurring ? "Servizio ricorrente" : "Progetto a consegne"}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ??
                project.status}
            </Badge>
          </div>
          <div>
            <h2 className="font-heading text-h1 text-foreground">{project.title}</h2>
            {project.description && (
              <p className="mt-2 text-body-md text-on-surface-variant max-w-prose">
                {project.description}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-2">
            <Stat
              label={isRecurring ? "Tariffa" : "Importo totale"}
              value={
                isRecurring
                  ? project.recurring_amount !== null
                    ? `${formatEUR(project.recurring_amount)}${project.recurring_period === "monthly" ? "/m" : "/q"}`
                    : "—"
                  : formatEUR(project.total_amount)
              }
            />
            {!isRecurring && (
              <Stat label="Avanzamento" value={`${progressPct}%`} />
            )}
            {project.start_date && (
              <Stat label="Inizio" value={formatDateIT(project.start_date)} />
            )}
            {project.end_date && (
              <Stat label="Fine prevista" value={formatDateIT(project.end_date)} />
            )}
          </dl>
        </CardContent>
      </Card>

      {!isRecurring && (
        <section className="grid gap-3">
          <h3 className="font-heading text-h3">Milestone</h3>
          <MilestoneList initial={milestones} projectId={projectId} />
          <NewMilestoneDialog projectId={projectId} />
        </section>
      )}

      {isRecurring && (
        <section>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-heading text-h3">Calendario ricorrenze</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-on-surface-variant">
                Il calendario delle ricorrenze (deliverable mensili, fatture
                automatiche dopo l&apos;integrazione Pyva) sarà disponibile nei prossimi
                Batch.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-on-surface-variant">
        {label}
      </dt>
      <dd className={cn("mt-1 font-medium text-foreground num-tabular")}>{value}</dd>
    </div>
  );
}
