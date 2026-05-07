import { Card, CardContent } from "@/components/ui/card";
import { loadClientLayoutData } from "@/lib/client-layout-data";
import { requireClientSession } from "@/lib/client-session";

export const metadata = { title: "Fatture · Workspace cliente" };

export default async function ClientInvoicesPage() {
  const session = await requireClientSession();
  const layout = await loadClientLayoutData(session);
  if (!layout) return null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          Fatture
        </span>
        <h1 className="font-heading text-h1 text-foreground">Le tue fatture</h1>
        <p className="text-on-surface-variant">
          Riceverai qui i PDF delle fatture emesse da {layout.branding.freelanceName} non
          appena saranno disponibili.
        </p>
      </header>

      <Card>
        <CardContent className="grid place-items-center gap-2 py-12 text-center">
          <p className="font-heading text-h3 text-foreground">In arrivo</p>
          <p className="max-w-md text-sm text-on-surface-variant">
            La sezione fatture sarà attiva con il prossimo aggiornamento. Nel frattempo,
            qualunque domanda di importo o pagamento puoi farla in chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
