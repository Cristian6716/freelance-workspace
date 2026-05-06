import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserAndProfile } from "@/lib/supabase/auth-helpers";
import { VERTICAL_LABELS, type Vertical } from "@/lib/validation/schemas";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  const verticalLabel = profile?.vertical
    ? VERTICAL_LABELS[profile.vertical as Vertical]
    : "—";

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
          Benvenuto
        </p>
        <h1 className="font-heading text-h1 text-foreground mb-2">
          Ciao {profile?.full_name?.split(" ")[0] ?? "👋"}
        </h1>
        <p className="text-body-md text-secondary max-w-prose">
          Account creato e onboarding completato. Da qui gestirai workspace,
          progetti, file e fatture. Le sezioni vere arrivano col Batch B.
        </p>
      </div>

      <Card className="bg-card max-w-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-h3">Il tuo profilo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Nome completo" value={profile?.full_name ?? "—"} />
          <Row
            label="Verticale"
            value={
              <Badge variant="secondary" className="rounded-full">
                {verticalLabel}
              </Badge>
            }
          />
          <Row label="Partita IVA" value={profile?.vat_number ?? "—"} mono />
          <Row label="Regime fiscale" value={profile?.fiscal_regime ?? "—"} capitalize />
          <Row label="IBAN" value={profile?.iban ?? "—"} mono />
          <Row label="Piano" value={profile?.subscription_tier ?? "free"} capitalize />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center text-sm">
      <dt className="col-span-1 text-on-surface-variant">{label}</dt>
      <dd
        className={[
          "col-span-2 text-foreground",
          mono ? "font-mono num-tabular" : "",
          capitalize ? "capitalize" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
