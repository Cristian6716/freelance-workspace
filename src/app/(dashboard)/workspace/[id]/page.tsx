import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { NewProjectDialog } from "@/components/app/new-project-dialog";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/app/project-card";
import {
  ProjectsFilterPills,
  type ProjectsFilterKey,
} from "@/components/app/projects-filter-pills";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-helpers";
import type { MilestoneStatus } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Progetti",
};

const FILTER_KEYS: readonly ProjectsFilterKey[] = ["all", "active", "completed", "draft"] as const;

function isFilterKey(v: string): v is ProjectsFilterKey {
  return (FILTER_KEYS as readonly string[]).includes(v);
}

export default async function WorkspaceProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id: workspaceId } = await params;
  const sp = await searchParams;
  const filter: ProjectsFilterKey =
    sp.filter && isFilterKey(sp.filter) ? sp.filter : "all";

  const supabase = await createClient();
  const user = await getCurrentUser();

  // Templates filtrati per verticale del freelance
  let templates: { id: string; name: string; description: string | null }[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("vertical")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.vertical) {
      const { data: tpls } = await supabase
        .from("templates")
        .select("id, name, description")
        .eq("vertical", profile.vertical)
        .eq("is_official", true)
        .order("name");
      templates = tpls ?? [];
    }
  }

  // Projects + milestones in 2 query
  const projQuery = supabase
    .from("projects")
    .select(
      "id, workspace_id, title, description, type, status, start_date, end_date, total_amount, recurring_period, recurring_amount"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (filter === "active") projQuery.eq("status", "active");
  if (filter === "completed") projQuery.eq("status", "completed");
  if (filter === "draft") projQuery.eq("status", "draft");

  const { data: rawProjects } = await projQuery;
  const projects = rawProjects ?? [];
  const projectIds = projects.map((p) => p.id);

  const milestonesByProject = new Map<
    string,
    { id: string; status: MilestoneStatus; title: string }[]
  >();
  if (projectIds.length > 0) {
    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, project_id, status, title, order_index")
      .in("project_id", projectIds)
      .order("order_index");
    for (const m of milestones ?? []) {
      const arr = milestonesByProject.get(m.project_id) ?? [];
      arr.push({ id: m.id, status: m.status as MilestoneStatus, title: m.title });
      milestonesByProject.set(m.project_id, arr);
    }
  }

  // Counts per filter pills
  const { data: allProjects } = await supabase
    .from("projects")
    .select("status")
    .eq("workspace_id", workspaceId);
  const counts: Record<ProjectsFilterKey, number> = {
    all: allProjects?.length ?? 0,
    active: 0,
    completed: 0,
    draft: 0,
  };
  for (const p of allProjects ?? []) {
    if (p.status === "active") counts.active += 1;
    if (p.status === "completed") counts.completed += 1;
    if (p.status === "draft") counts.draft += 1;
  }

  const cards: ProjectCardData[] = projects.map((p) => ({
    id: p.id,
    workspace_id: p.workspace_id,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    start_date: p.start_date,
    end_date: p.end_date,
    total_amount: p.total_amount,
    recurring_period: p.recurring_period,
    recurring_amount: p.recurring_amount,
    milestones: milestonesByProject.get(p.id) ?? [],
  }));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-h3">Progetti</h2>
        <NewProjectDialog workspaceId={workspaceId} templates={templates} />
      </div>

      <ProjectsFilterPills current={filter} counts={counts} />

      {cards.length > 0 ? (
        <div className="grid gap-4">
          {cards.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="grid place-items-center gap-3 py-14 text-center">
            <p className="font-heading text-h3 text-foreground">
              Nessun progetto {filter !== "all" && filter !== "active" ? `(${filter})` : "qui"}
            </p>
            <p className="max-w-md text-sm text-on-surface-variant">
              Crea il primo progetto del cliente. Puoi partire da un template per
              avere milestone già pronte.
            </p>
            <div className="mt-2">
              <NewProjectDialog workspaceId={workspaceId} templates={templates} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
