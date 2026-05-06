"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMilestoneAction,
  type MilestoneActionResult,
} from "@/actions/milestones";

export function NewMilestoneDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [state, formAction] = useActionState<MilestoneActionResult | null, FormData>(
    async (_prev, formData) => {
      const result = await createMilestoneAction(_prev, formData);
      if (result.ok) {
        toast.success("Milestone aggiunta");
        setOpen(false);
        startTransition(() => router.refresh());
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
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-card/40 px-4 py-4 text-sm text-on-surface-variant transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <PlusIcon className="h-4 w-4" />
            Nuova milestone
          </button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-h3">Nuova milestone</DialogTitle>
          <DialogDescription>
            Aggiungi un deliverable al progetto.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 pt-2">
          <input type="hidden" name="project_id" value={projectId} />
          <div className="grid gap-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input id="title" name="title" required autoFocus placeholder="Wireframe homepage" />
            <FieldError errors={fieldErrors?.title} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrizione</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="due_date">Scadenza</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="500"
                className="num-tabular"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes_internal">Note interne (private)</Label>
            <textarea
              id="notes_internal"
              name="notes_internal"
              rows={2}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Visibili solo a te"
            />
          </div>
          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline">Annulla</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Aggiungi
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
