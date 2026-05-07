import Link from "next/link";

import { ClientProjectCard } from "@/components/client/client-project-card";
import { Card, CardContent } from "@/components/ui/card";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";
import { relativeTimeIT } from "@/lib/utils";

export const metadata = { title: "Panoramica · Workspace cliente" };

export default async function ClientOverviewPage() {
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null; // layout fa già redirect

  const admin = createServiceClient();

  const [
    { data: projects },
    { data: latestMessage },
    { count: unreadCount },
    { count: pendingInvoicesCount },
  ] = await Promise.all([
    admin
      .from("projects")
      .select(
        "id, title, type, status, recurring_period, milestones(id, status, title, order_index)"
      )
      .eq("workspace_id", session.workspaceId)
      .in("status", ["active", "completed"])
      .order("created_at", { ascending: false }),
    admin
      .from("messages")
      .select("id, body, created_at, sender_member_id")
      .eq("workspace_id", session.workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", session.workspaceId)
      .is("read_at", null)
      .is("sender_member_id", null),
    admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", session.workspaceId)
      .in("status", ["issued", "overdue"]),
  ]);

  const activeProjects = (projects ?? []).filter((p) => p.status === "active");
  // Milestone delivered = "Cosa serve da te" (approva o richiedi modifiche)
  const pendingApprovals: Array<{
    projectId: string;
    projectTitle: string;
    milestoneId: string;
    milestoneTitle: string;
  }> = [];
  for (const p of projects ?? []) {
    for (const m of p.milestones ?? []) {
      if (m.status === "delivered") {
        pendingApprovals.push({
          projectId: p.id,
          projectTitle: p.title,
          milestoneId: m.id,
          milestoneTitle: m.title,
        });
      }
    }
  }

  const latestMessageFromFreelance =
    latestMessage && latestMessage.sender_member_id === null ? latestMessage : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Bentornato
        </span>
        <h1 className="font-heading text-h1 text-foreground">
          Ciao {layout.workspace.clientName}, ecco a che punto siamo.
        </h1>
        <p className="text-on-surface-variant">
          {latestMessageFromFreelance
            ? `Ultimo aggiornamento da ${layout.branding.freelanceName}: ${relativeTimeIT(latestMessageFromFreelance.created_at)}.`
            : `${layout.branding.freelanceName} non ha ancora inviato aggiornamenti — apri pure il workspace.`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Colonna sinistra: progetti + cosa serve da te */}
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-h2 text-foreground">I tuoi progetti</h2>
            {activeProjects.length > 3 && (
              <Link
                href="/client/projects"
                className="text-sm text-on-surface-variant hover:text-foreground"
              >
                Vedi tutti ({activeProjects.length})
              </Link>
            )}
          </div>

          {activeProjects.length === 0 ? (
            <Card>
              <CardContent className="grid place-items-center gap-2 py-12 text-center">
                <p className="font-heading text-h3 text-foreground">Nessun progetto attivo</p>
                <p className="text-sm text-on-surface-variant">
                  {layout.branding.freelanceName} sta preparando il primo progetto. Riceverai
                  un aggiornamento appena pronto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {activeProjects.slice(0, 3).map((p) => (
                <ClientProjectCard
                  key={p.id}
                  project={{
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    status: p.status,
                    milestones: (p.milestones ?? []).map((m) => ({
                      id: m.id,
                      status: m.status,
                      title: m.title,
                      order_index: m.order_index,
                    })),
                  }}
                  brandColor={layout.branding.brandColor}
                />
              ))}
            </div>
          )}

          {pendingApprovals.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-heading text-h3 text-foreground border-b border-outline-variant/40 pb-2">
                Cosa serve da te
              </h3>
              <ul className="flex flex-col gap-3">
                {pendingApprovals.map((a) => (
                  <li key={a.milestoneId}>
                    <Link
                      href={`/client/projects/${a.projectId}#m-${a.milestoneId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-4 transition-colors hover:border-outline-variant"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-on-surface-variant">
                          {a.projectTitle}
                        </span>
                        <span className="font-medium text-foreground">
                          Approva &laquo;{a.milestoneTitle}&raquo;
                        </span>
                      </div>
                      <span className="text-on-surface-variant" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        {/* Colonna destra: riepilogo + messaggi recenti */}
        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 py-5">
              <h3 className="font-heading text-h3 text-foreground">Riepilogo</h3>
              <Stat label="Progetti attivi" value={activeProjects.length} />
              <Stat label="Fatture in attesa" value={pendingInvoicesCount ?? 0} />
              <Stat label="Messaggi non letti" value={unreadCount ?? 0} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 py-5">
              <h3 className="font-heading text-h3 text-foreground">Ultima fattura</h3>
              <p className="text-sm text-on-surface-variant">
                Le fatture verranno mostrate qui appena {layout.branding.freelanceName} le emette.
              </p>
            </CardContent>
          </Card>

          {latestMessageFromFreelance && (
            <Card>
              <CardContent className="flex flex-col gap-3 py-5">
                <h3 className="font-heading text-h3 text-foreground">Messaggio recente</h3>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground">
                  {latestMessageFromFreelance.body}
                </p>
                <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
                  {relativeTimeIT(latestMessageFromFreelance.created_at)}
                </span>
                <Link
                  href="/client/messages"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  Apri conversazione →
                </Link>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-outline-variant/30 pb-2 last:border-b-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="font-medium num-tabular">{value}</span>
    </div>
  );
}
