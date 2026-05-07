import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MILESTONE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type MilestoneStatus,
} from "@/lib/validation/schemas";

type Milestone = {
  id: string;
  status: string;
  title: string;
  order_index: number;
};

type Project = {
  id: string;
  title: string;
  type: string;
  status: string;
  milestones: Milestone[];
};

type Props = {
  project: Project;
  brandColor: string | null;
};

const ACCENT_FALLBACK = "#1b1345";

function isHex(c: string | null): c is string {
  return c !== null && /^#[0-9A-Fa-f]{6}$/.test(c);
}

export function ClientProjectCard({ project, brandColor }: Props) {
  const accent = isHex(brandColor) ? brandColor : ACCENT_FALLBACK;
  const sortedMs = [...project.milestones].sort(
    (a, b) => a.order_index - b.order_index
  );
  const total = sortedMs.length;
  const completed = sortedMs.filter(
    (m) => m.status === "delivered" || m.status === "approved"
  ).length;
  const inProgress = sortedMs.find((m) => m.status === "in_progress");
  const pendingApproval = sortedMs.find((m) => m.status === "delivered");

  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const statusLabel =
    PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ??
    project.status;

  // Frase status conversazionale
  let statusSentence: string;
  if (total === 0) {
    statusSentence = "Le milestone arriveranno a breve.";
  } else if (pendingApproval) {
    statusSentence = `«${pendingApproval.title}» è pronta per la tua approvazione.`;
  } else if (inProgress) {
    statusSentence = `Stiamo lavorando a «${inProgress.title}».`;
  } else if (completed === total) {
    statusSentence = "Tutte le milestone sono completate.";
  } else {
    const next = sortedMs.find((m) => m.status === "todo");
    statusSentence = next ? `Prossima fase: «${next.title}».` : "In avanzamento.";
  }

  return (
    <Card className="flex flex-col gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0_8px_24px_-8px_rgba(28,27,31,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-h3 text-foreground">{project.title}</h3>
        <Badge
          variant="secondary"
          className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider"
        >
          {statusLabel}
        </Badge>
      </div>

      {project.type === "deliverable" ? (
        <DeliverableProgress
          milestones={sortedMs.slice(0, 4)}
          accent={accent}
          progressPct={progressPct}
        />
      ) : (
        <RecurringStrip accent={accent} />
      )}

      <p className="text-sm text-on-surface-variant">{statusSentence}</p>

      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
        {pendingApproval ? (
          <Link
            href={`/client/projects/${project.id}#m-${pendingApproval.id}`}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: accent, color: accent }}
          >
            Apri per approvare
          </Link>
        ) : (
          <span className="text-sm text-on-surface-variant">
            {completed} di {total} milestone completate
          </span>
        )}
        <Link
          href={`/client/projects/${project.id}`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          Vedi dettaglio →
        </Link>
      </div>
    </Card>
  );
}

function DeliverableProgress({
  milestones,
  accent,
  progressPct,
}: {
  milestones: Milestone[];
  accent: string;
  progressPct: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progressPct}%`, backgroundColor: accent }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avanzamento progetto"
        />
      </div>
      {milestones.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {milestones.map((m) => {
            const isDone = m.status === "approved" || m.status === "delivered";
            const isInProgress = m.status === "in_progress";
            const label = MILESTONE_STATUS_LABELS[m.status as MilestoneStatus] ?? m.status;
            return (
              <span
                key={m.id}
                className={cn(
                  "flex items-center gap-1 font-medium",
                  isDone
                    ? "text-foreground"
                    : isInProgress
                      ? ""
                      : "text-on-surface-variant"
                )}
                style={isInProgress ? { color: accent } : undefined}
                title={`${m.title}: ${label}`}
              >
                {m.title}
                {isDone && " ✓"}
                {isInProgress && " (in corso)"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecurringStrip({ accent }: { accent: string }) {
  // 12 segmenti mensili — placeholder visuale per progetti ricorrenti.
  return (
    <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-surface-container">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn("flex-1 border-l border-white/30 first:border-l-0")}
          style={{
            backgroundColor: i < 4 ? accent : "transparent",
          }}
        />
      ))}
    </div>
  );
}
