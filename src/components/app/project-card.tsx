import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn, formatDateIT, formatEUR } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  type MilestoneStatus,
} from "@/lib/validation/schemas";

export type ProjectCardData = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  type: "deliverable" | "recurring" | string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_amount: number | null;
  recurring_period: string | null;
  recurring_amount: number | null;
  milestones: { id: string; status: MilestoneStatus; title: string }[];
};

const STATUS_DOT: Record<string, string> = {
  draft: "bg-outline-variant",
  active: "bg-primary-container",
  completed: "bg-emerald-500",
  archived: "bg-outline",
};

const TYPE_BADGE: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  deliverable: { label: "PROGETTO A CONSEGNE", bg: "#e5dffb", fg: "#1b1345" },
  recurring: { label: "SERVIZIO RICORRENTE", bg: "#dbe8ff", fg: "#0a366d" },
};

const DRAFT_BADGE = { label: "BOZZA", bg: "#e6e1e6", fg: "#48454f" };

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const isRecurring = project.type === "recurring";
  const isDraft = project.status === "draft";
  const badge = isDraft
    ? DRAFT_BADGE
    : TYPE_BADGE[project.type] ?? DRAFT_BADGE;

  return (
    <Link
      href={`/workspace/${project.workspace_id}/projects/${project.id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl bg-card p-5 transition-all",
        "ring-1 ring-outline-variant/60 hover:ring-foreground/40",
        "shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: badge.bg, color: badge.fg }}
        >
          {badge.label}
        </span>
        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
          <span
            className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", STATUS_DOT[project.status])}
            aria-hidden="true"
          />
          {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ??
            project.status}
        </Badge>
      </div>

      <div>
        <h3 className="font-heading text-h3 text-foreground">{project.title}</h3>
        {project.description && (
          <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {!isRecurring && project.milestones.length > 0 && (
        <MilestoneTimeline milestones={project.milestones} />
      )}
      {isRecurring && (
        <RecurringTimeline
          period={project.recurring_period}
          startDate={project.start_date}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-outline-variant/40 pt-4 text-sm">
        {!isRecurring && project.total_amount !== null && (
          <span className="text-on-surface-variant">
            Importo:{" "}
            <span className="num-tabular font-medium text-foreground">
              {formatEUR(project.total_amount)}
            </span>
          </span>
        )}
        {isRecurring && project.recurring_amount !== null && (
          <span className="text-on-surface-variant">
            Tariffa:{" "}
            <span className="num-tabular font-medium text-foreground">
              {formatEUR(project.recurring_amount)}
            </span>
            {project.recurring_period === "monthly" ? "/mese" : "/trimestre"}
          </span>
        )}
        {project.end_date && (
          <span className="text-on-surface-variant">
            Scadenza:{" "}
            <span className="font-medium text-foreground">
              {formatDateIT(project.end_date)}
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}

function MilestoneTimeline({
  milestones,
}: {
  milestones: ProjectCardData["milestones"];
}) {
  // Visualizza max 8 milestone, abbozzando lo stato come cerchi che si riempiono
  const items = milestones.slice(0, 8);
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {items.map((m) => (
        <span
          key={m.id}
          className={cn(
            "h-3.5 w-3.5 shrink-0 rounded-full border-2",
            m.status === "approved" && "border-emerald-500 bg-emerald-500",
            m.status === "delivered" &&
              "border-emerald-500 bg-gradient-to-br from-emerald-500 from-50% to-transparent to-50%",
            m.status === "in_progress" &&
              "border-primary-container bg-gradient-to-br from-primary-container from-50% to-transparent to-50%",
            m.status === "todo" && "border-outline-variant bg-transparent"
          )}
          title={m.title}
          aria-label={`Milestone "${m.title}": ${m.status}`}
        />
      ))}
      {milestones.length > items.length && (
        <span className="text-xs text-on-surface-variant ml-2">
          +{milestones.length - items.length}
        </span>
      )}
    </div>
  );
}

function RecurringTimeline({
  period,
  startDate,
}: {
  period: string | null;
  startDate: string | null;
}) {
  // 12 pillole per un anno, evidenziato il mese corrente
  const months = 12;
  const now = new Date();
  const currentMonth = now.getMonth();
  return (
    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
      {Array.from({ length: months }).map((_, i) => {
        const isPast = i < currentMonth;
        const isCurrent = i === currentMonth;
        return (
          <span
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-full",
              isCurrent && "bg-primary-container",
              isPast && "bg-foreground/40",
              !isCurrent && !isPast && "bg-outline-variant"
            )}
            aria-hidden="true"
          />
        );
      })}
      {period && (
        <span className="ml-2 shrink-0 uppercase tracking-wider">
          {period === "monthly" ? "Mensile" : "Trimestrale"}
        </span>
      )}
      {startDate && <span className="hidden sm:inline ml-2 shrink-0">dal {formatDateIT(startDate)}</span>}
    </div>
  );
}
