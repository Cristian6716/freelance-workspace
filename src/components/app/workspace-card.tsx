import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  avatarColorFor,
  cn,
  initialsFor,
  relativeTimeIT,
} from "@/lib/utils";
import { CLIENT_TYPE_LABELS } from "@/lib/validation/schemas";

export type WorkspaceCardData = {
  id: string;
  client_name: string;
  client_type: string;
  status: string;
  updated_at: string | null;
  active_projects: number;
  pending_invoices: number;
  total_progress_pct: number; // 0..1
};

export function WorkspaceCard({ workspace }: { workspace: WorkspaceCardData }) {
  const palette = avatarColorFor(workspace.client_name || workspace.id);
  const initials = initialsFor(workspace.client_name);
  const typeLabel =
    CLIENT_TYPE_LABELS[workspace.client_type as keyof typeof CLIENT_TYPE_LABELS] ??
    workspace.client_type;
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round(workspace.total_progress_pct * 100))
  );

  return (
    <Link
      href={`/workspace/${workspace.id}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl bg-card p-5 transition-all",
        "ring-1 ring-outline-variant/60 hover:ring-foreground/40",
        "shadow-sm hover:shadow-md",
        workspace.status === "archived" && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold"
          style={{ backgroundColor: palette.bg, color: palette.fg }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-h3 truncate text-foreground">
            {workspace.client_name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
              {typeLabel}
            </Badge>
            {workspace.status === "archived" && (
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                Archiviato
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-on-surface-variant">
          <span className="num-tabular font-medium text-foreground">
            {workspace.active_projects}
          </span>{" "}
          {workspace.active_projects === 1 ? "progetto attivo" : "progetti attivi"}
          <span className="mx-2 text-outline-variant">·</span>
          <span className="num-tabular font-medium text-foreground">
            {workspace.pending_invoices}
          </span>{" "}
          {workspace.pending_invoices === 1
            ? "fattura in sospeso"
            : "fatture in sospeso"}
        </p>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-on-surface-variant">
            <span>Avanzamento aggregato</span>
            <span className="num-tabular font-semibold text-foreground">
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
            <div
              className="h-full bg-primary-container transition-all"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <p className="mt-auto text-xs text-on-surface-variant">
        Aggiornato {relativeTimeIT(workspace.updated_at)}
      </p>
    </Link>
  );
}
