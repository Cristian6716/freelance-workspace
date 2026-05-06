import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseBusinessIcon, FileClockIcon, EuroIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { NewWorkspaceDialog } from "@/components/app/new-workspace-dialog";
import {
  DashboardFilterPills,
  type DashboardFilterKey,
} from "@/components/app/dashboard-filter-pills";
import {
  WorkspaceCard,
  type WorkspaceCardData,
} from "@/components/app/workspace-card";
import { getCurrentUserAndProfile } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const FILTER_KEYS: readonly DashboardFilterKey[] = ["all", "active", "archived"] as const;

function isFilterKey(v: string): v is DashboardFilterKey {
  return (FILTER_KEYS as readonly string[]).includes(v);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter: DashboardFilterKey = sp.filter && isFilterKey(sp.filter) ? sp.filter : "all";

  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/signin");

  const supabase = await createClient();

  // ---- Workspaces (con counts derivati) ----
  const wsQuery = supabase
    .from("client_workspaces")
    .select("id, client_name, client_type, status, updated_at")
    .order("updated_at", { ascending: false });

  if (filter === "active") wsQuery.eq("status", "active");
  if (filter === "archived") wsQuery.eq("status", "archived");

  const { data: workspaces } = await wsQuery;
  const wsList = workspaces ?? [];
  const wsIds = wsList.map((w) => w.id);

  // counts: progetti attivi e fatture pending per ciascun workspace
  // (in MVP usiamo n+1 piccolo: select aggregato in JS dopo)
  const projectsByWs = new Map<string, { active: number; total: number; completed: number }>();
  const invoicesByWs = new Map<string, number>();
  if (wsIds.length > 0) {
    const [{ data: projRows }, { data: invRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("workspace_id, status")
        .in("workspace_id", wsIds),
      supabase
        .from("invoices")
        .select("workspace_id, status")
        .in("workspace_id", wsIds)
        .in("status", ["issued", "overdue"]),
    ]);

    for (const p of projRows ?? []) {
      const m = projectsByWs.get(p.workspace_id) ?? { active: 0, total: 0, completed: 0 };
      m.total += 1;
      if (p.status === "active") m.active += 1;
      if (p.status === "completed") m.completed += 1;
      projectsByWs.set(p.workspace_id, m);
    }
    for (const i of invRows ?? []) {
      invoicesByWs.set(i.workspace_id, (invoicesByWs.get(i.workspace_id) ?? 0) + 1);
    }
  }

  // ---- Stat cards ----
  const { count: activeWorkspacesCount } = await supabase
    .from("client_workspaces")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pendingInvoicesCount } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .in("status", ["issued", "overdue"]);

  // Cassa del mese: somma amount delle invoices paid_at >= primo del mese corrente
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { data: paidThisMonth } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", startOfMonth.toISOString());
  const cashThisMonth = (paidThisMonth ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);

  // Counts filtri per pills
  const { count: allCount } = await supabase
    .from("client_workspaces")
    .select("id", { count: "exact", head: true });
  const { count: activeCount } = await supabase
    .from("client_workspaces")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  const { count: archivedCount } = await supabase
    .from("client_workspaces")
    .select("id", { count: "exact", head: true })
    .eq("status", "archived");

  const cards: WorkspaceCardData[] = wsList.map((w) => {
    const proj = projectsByWs.get(w.id) ?? { active: 0, total: 0, completed: 0 };
    const progress = proj.total > 0 ? proj.completed / proj.total : 0;
    return {
      id: w.id,
      client_name: w.client_name,
      client_type: w.client_type,
      status: w.status,
      updated_at: w.updated_at,
      active_projects: proj.active,
      pending_invoices: invoicesByWs.get(w.id) ?? 0,
      total_progress_pct: progress,
    };
  });

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label-caps uppercase tracking-widest text-on-surface-variant mb-1">
            Benvenuto{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </p>
          <h1 className="font-heading text-h1 text-foreground">I miei clienti</h1>
        </div>
        <NewWorkspaceDialog />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={BriefcaseBusinessIcon}
          label="Workspace attivi"
          value={String(activeWorkspacesCount ?? 0)}
        />
        <StatCard
          icon={FileClockIcon}
          label="Fatture in attesa"
          value={String(pendingInvoicesCount ?? 0)}
        />
        <StatCard
          icon={EuroIcon}
          label="Incassato questo mese"
          value={formatEUR(cashThisMonth)}
        />
      </div>

      {/* Filter pills */}
      <DashboardFilterPills
        current={filter}
        counts={{
          all: allCount ?? 0,
          active: activeCount ?? 0,
          archived: archivedCount ?? 0,
        }}
      />

      {/* Workspace grid */}
      {cards.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((w) => (
            <WorkspaceCard key={w.id} workspace={w} />
          ))}
        </div>
      ) : (
        <EmptyState filter={filter} />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>
          <p className="mt-1 font-heading text-h2 num-tabular text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ filter }: { filter: DashboardFilterKey }) {
  if (filter === "archived") {
    return (
      <Card className="bg-card">
        <CardContent className="grid place-items-center gap-2 py-16 text-center">
          <p className="font-heading text-h3 text-foreground">Nessun workspace archiviato</p>
          <p className="text-sm text-on-surface-variant max-w-md">
            I workspace che archivi appariranno qui. Restano accessibili in lettura, ma escono dalla
            dashboard quotidiana.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-card">
      <CardContent className="grid place-items-center gap-3 py-16 text-center">
        <p className="font-heading text-h3 text-foreground">Inizia con il tuo primo cliente</p>
        <p className="text-sm text-on-surface-variant max-w-md">
          Crea un workspace per ogni cliente: contiene progetti, milestone, file e tutta la
          comunicazione in un solo posto.
        </p>
        <div className="mt-2">
          <NewWorkspaceDialog />
        </div>
      </CardContent>
    </Card>
  );
}
