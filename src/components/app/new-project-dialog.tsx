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
import { createProjectAction, type ProjectActionResult } from "@/actions/projects";

type Template = {
  id: string;
  name: string;
  description: string | null;
};

type Props = {
  workspaceId: string;
  templates: Template[];
  trigger?: ReactElement;
};

export function NewProjectDialog({ workspaceId, templates, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"deliverable" | "recurring">("deliverable");
  const [templateId, setTemplateId] = useState<string>("");
  const [period, setPeriod] = useState<"monthly" | "quarterly">("monthly");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [state, formAction] = useActionState<ProjectActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await createProjectAction(_prev, formData);
      if (result.ok) {
        toast.success("Progetto creato");
        setOpen(false);
        if (result.id) {
          startTransition(() => {
            router.push(`/workspace/${workspaceId}/projects/${result.id}`);
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
              Nuovo progetto
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-h3">Nuovo progetto</DialogTitle>
          <DialogDescription>
            Scegli se è un progetto a consegne con milestone o un servizio ricorrente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 pt-2">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="type" value={type} />
          {type === "recurring" && (
            <input type="hidden" name="recurring_period" value={period} />
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("deliverable")}
              className={
                "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left text-sm transition-colors " +
                (type === "deliverable"
                  ? "border-primary bg-secondary-container/40"
                  : "border-outline-variant hover:border-foreground/40")
              }
            >
              <span className="font-semibold">A consegne</span>
              <span className="text-xs text-on-surface-variant">
                Milestone con date e importi
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType("recurring")}
              className={
                "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left text-sm transition-colors " +
                (type === "recurring"
                  ? "border-primary bg-secondary-container/40"
                  : "border-outline-variant hover:border-foreground/40")
              }
            >
              <span className="font-semibold">Ricorrente</span>
              <span className="text-xs text-on-surface-variant">
                Tariffa mensile o trimestrale
              </span>
            </button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              name="title"
              required
              autoFocus
              placeholder="Sito vetrina 5 pagine"
            />
            <FieldError errors={fieldErrors?.title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrizione</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Cosa farai per il cliente"
            />
          </div>

          {type === "deliverable" && templates.length > 0 && (
            <div className="grid gap-2">
              <Label>Template (opzionale)</Label>
              <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Inizia da template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="template_id" value={templateId} />
              <p className="text-xs text-on-surface-variant">
                I template precaricano milestone tipiche per la tua professione.
              </p>
            </div>
          )}

          {type === "deliverable" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="start_date">Inizio</Label>
                <Input id="start_date" name="start_date" type="date" />
              </div>
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="end_date">Fine prevista</Label>
                <Input id="end_date" name="end_date" type="date" />
              </div>
              <div className="grid gap-2 sm:col-span-1">
                <Label htmlFor="total_amount">Importo totale (€)</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  inputMode="decimal"
                  placeholder="2500"
                  className="num-tabular"
                />
              </div>
            </div>
          )}

          {type === "recurring" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Periodicità</Label>
                <Select value={period} onValueChange={(v) => setPeriod((v ?? "monthly") as typeof period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensile</SelectItem>
                    <SelectItem value="quarterly">Trimestrale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recurring_amount">Tariffa (€)</Label>
                <Input
                  id="recurring_amount"
                  name="recurring_amount"
                  inputMode="decimal"
                  className="num-tabular"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose render={<Button variant="outline" type="button">Annulla</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Crea progetto
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
