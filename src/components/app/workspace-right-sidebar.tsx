import "server-only";

import {
  ActivityIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CircleIcon,
  FileUpIcon,
  FolderPlusIcon,
  MessageCircleIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn, formatEUR, relativeTimeIT } from "@/lib/utils";

type Props = {
  workspaceId: string;
  createdAt: string;
};

const EVENT_ICON: Record<string, typeof ActivityIcon> = {
  project_created: FolderPlusIcon,
  project_completed: CheckCircle2Icon,
  project_archived: CircleIcon,
  milestone_created: CircleIcon,
  milestone_in_progress: CircleDotIcon,
  milestone_delivered: CheckCircle2Icon,
  milestone_approved: CheckCircle2Icon,
  file_uploaded: FileUpIcon,
  file_deleted: FileUpIcon,
  message_sent: MessageCircleIcon,
};

const EVENT_LABEL: Record<string, (meta: Record<string, unknown>) => string> = {
  project_created: (m) => `Progetto creato: ${m.title ?? "—"}`,
  project_completed: (m) => `Progetto completato: ${m.title ?? "—"}`,
  project_archived: (m) => `Progetto archiviato: ${m.title ?? "—"}`,
  milestone_created: (m) => `Milestone aggiunta: ${m.title ?? "—"}`,
  milestone_in_progress: (m) => `Milestone in corso: ${m.title ?? "—"}`,
  milestone_delivered: (m) => `Milestone consegnata: ${m.title ?? "—"}`,
  milestone_approved: (m) => `Milestone approvata: ${m.title ?? "—"}`,
  file_uploaded: (m) => `File caricato: ${m.filename ?? "—"}`,
  file_deleted: (m) => `File rimosso: ${m.filename ?? "—"}`,
  message_sent: (m) => {
    const preview = typeof m.preview === "string" ? m.preview : "";
    return preview ? `Messaggio: "${preview}…"` : "Messaggio inviato";
  },
};

export async function WorkspaceRightSidebar({ workspaceId, createdAt }: Props) {
  const supabase = await createClient();

  const [
    { count: projectsTotal },
    { data: paidInvoices },
    { data: unpaidInvoices },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("invoices")
      .select("amount, issue_date, paid_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "paid"),
    supabase
      .from("invoices")
      .select("amount")
      .eq("workspace_id", workspaceId)
      .in("status", ["issued", "overdue"]),
    supabase
      .from("workspace_activity_log")
      .select("id, event_type, entity_id, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalPaid = (paidInvoices ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalUnpaid = (unpaidInvoices ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);

  // Tempo medio pagamento: media (paid_at - issue_date) in giorni; null se zero
  let avgPaymentDays: number | null = null;
  if ((paidInvoices ?? []).length > 0) {
    const diffs: number[] = [];
    for (const p of paidInvoices ?? []) {
      if (p.paid_at && p.issue_date) {
        const d1 = new Date(p.issue_date).getTime();
        const d2 = new Date(p.paid_at).getTime();
        const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
        if (Number.isFinite(days) && days >= 0) diffs.push(days);
      }
    }
    if (diffs.length > 0) {
      avgPaymentDays = Math.round(diffs.reduce((s, n) => s + n, 0) / diffs.length);
    }
  }

  return (
    <aside className="grid gap-5">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-h3">Riepilogo cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <SummaryRow label="Progetti totali" value={String(projectsTotal ?? 0)} />
          <SummaryRow label="Fatturato totale" value={formatEUR(totalPaid)} />
          <SummaryRow label="In attesa" value={formatEUR(totalUnpaid)} />
          <SummaryRow
            label="Cliente da"
            value={relativeTimeIT(createdAt)}
          />
          <SummaryRow
            label="Tempo medio pagamento"
            value={avgPaymentDays !== null ? `${avgPaymentDays} giorni` : "—"}
          />
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="font-heading text-h3">Attività recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {(activity ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Nessuna attività ancora. I primi eventi appariranno qui.
            </p>
          ) : (
            <ul className="grid gap-3">
              {(activity ?? []).map((ev) => {
                const Icon = EVENT_ICON[ev.event_type] ?? ActivityIcon;
                const meta = (ev.metadata ?? {}) as Record<string, unknown>;
                const labelFn = EVENT_LABEL[ev.event_type];
                const label = labelFn ? labelFn(meta) : ev.event_type;
                return (
                  <li key={ev.id} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        "bg-secondary-container text-on-secondary-container"
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="text-foreground truncate">{label}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {relativeTimeIT(ev.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-foreground num-tabular">{value}</span>
    </div>
  );
}
