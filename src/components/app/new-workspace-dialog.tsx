"use client";

import type { ReactElement } from "react";
import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, Loader2Icon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWorkspaceAction, type WorkspaceActionResult } from "@/actions/workspaces";

export function NewWorkspaceDialog({ trigger }: { trigger?: ReactElement }) {
  const [open, setOpen] = useState(false);
  const [clientType, setClientType] = useState<"private" | "company" | "pa">("company");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [state, formAction] = useActionState<WorkspaceActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await createWorkspaceAction(_prev, formData);
      if (result.ok) {
        toast.success("Workspace creato");
        setOpen(false);
        if (result.id) {
          startTransition(() => {
            router.push(`/workspace/${result.id}`);
          });
        }
      } else {
        toast.error(result.error);
      }
      return result;
    },
    null
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon className="h-4 w-4" />
              Nuovo workspace cliente
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-h3">Nuovo workspace cliente</DialogTitle>
          <DialogDescription>
            Crea uno spazio condiviso per gestire progetti, file e fatture di un cliente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 pt-2">
          <input type="hidden" name="client_type" value={clientType} />

          <div className="grid gap-2">
            <Label htmlFor="client_name">Nome cliente *</Label>
            <Input
              id="client_name"
              name="client_name"
              required
              placeholder="Studio Bianchi srl"
              autoFocus
            />
            <FieldError errors={fieldErrors?.client_name} />
          </div>

          <div className="grid gap-2">
            <Label>Tipo cliente *</Label>
            <Select value={clientType} onValueChange={(v) => setClientType((v ?? "company") as typeof clientType)}>
              <SelectTrigger id="client_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Azienda</SelectItem>
                <SelectItem value="pa">PA</SelectItem>
                <SelectItem value="private">Privato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                placeholder="info@studiobianchi.it"
              />
              <FieldError errors={fieldErrors?.client_email} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_phone">Telefono</Label>
              <Input
                id="client_phone"
                name="client_phone"
                type="tel"
                placeholder="+39 02 1234567"
              />
              <FieldError errors={fieldErrors?.client_phone} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client_vat">
                P.IVA{clientType !== "private" && " *"}
              </Label>
              <Input
                id="client_vat"
                name="client_vat"
                placeholder="IT12345678901"
                className="num-tabular"
              />
              <FieldError errors={fieldErrors?.client_vat} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_sdi_code">Codice destinatario / PEC</Label>
              <Input
                id="client_sdi_code"
                name="client_sdi_code"
                placeholder="0000000 o pec@cliente.it"
              />
              <FieldError errors={fieldErrors?.client_sdi_code} />
            </div>
          </div>

          <details className="rounded-lg border border-border px-4 py-2.5 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
              Indirizzo (opzionale)
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-6">
              <div className="grid gap-2 sm:col-span-4">
                <Label htmlFor="address_street" className="text-xs text-on-surface-variant">
                  Via
                </Label>
                <Input id="address_street" name="address_street" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="address_cap" className="text-xs text-on-surface-variant">
                  CAP
                </Label>
                <Input id="address_cap" name="address_cap" inputMode="numeric" />
              </div>
              <div className="grid gap-2 sm:col-span-3">
                <Label htmlFor="address_city" className="text-xs text-on-surface-variant">
                  Città
                </Label>
                <Input id="address_city" name="address_city" />
              </div>
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="address_province" className="text-xs text-on-surface-variant">
                  Prov.
                </Label>
                <Input
                  id="address_province"
                  name="address_province"
                  maxLength={2}
                  className="uppercase"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="address_country" className="text-xs text-on-surface-variant">
                  Paese
                </Label>
                <Input id="address_country" name="address_country" defaultValue="Italia" />
              </div>
            </div>
          </details>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button variant="outline" type="button">Annulla</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Crea workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
