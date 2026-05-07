import Link from "next/link";
import { ChevronRightIcon, MailIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { avatarColorFor, initialsFor } from "@/lib/utils";
import { CLIENT_TYPE_LABELS } from "@/lib/validation/schemas";

type Props = {
  workspace: {
    id: string;
    client_name: string;
    client_type: string;
    client_email: string | null;
    client_vat: string | null;
    client_address: { city?: string | null } | null;
    status: string;
  };
};

export function WorkspaceHeader({ workspace }: Props) {
  const palette = avatarColorFor(workspace.client_name || workspace.id);
  const typeLabel =
    CLIENT_TYPE_LABELS[workspace.client_type as keyof typeof CLIENT_TYPE_LABELS] ??
    workspace.client_type;
  const city = workspace.client_address?.city ?? null;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-on-surface-variant">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground truncate" aria-current="page">
          {workspace.client_name}
        </span>
      </nav>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-heading text-h3 font-medium"
            style={{ backgroundColor: palette.bg, color: palette.fg }}
            aria-hidden="true"
          >
            {initialsFor(workspace.client_name)}
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-h1 text-foreground">{workspace.client_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                {typeLabel}
              </Badge>
              {workspace.client_vat && (
                <span className="num-tabular">P.IVA {workspace.client_vat}</span>
              )}
              {workspace.client_email && (
                <a
                  href={`mailto:${workspace.client_email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {workspace.client_email}
                </a>
              )}
              {city && <span>{city}</span>}
              {workspace.status === "archived" && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
                  Archiviato
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspace/${workspace.id}/settings#invite`}
            className={buttonVariants({ variant: "outline" })}
          >
            <MailIcon className="h-4 w-4" />
            Invita cliente
          </Link>
          <Button disabled title="Disponibile in Batch D">
            <PlusIcon className="h-4 w-4" />
            Nuova fattura
          </Button>
        </div>
      </div>
    </div>
  );
}
