"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2Icon, Loader2Icon, MessageSquareIcon } from "lucide-react";

import {
  approveMilestoneAction,
  requestMilestoneRevisionAction,
  undoApproveMilestoneAction,
} from "@/actions/client-mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  MILESTONE_STATUS_LABELS,
  type MilestoneStatus,
} from "@/lib/validation/schemas";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  amount: number | null;
  due_date: string | null;
  order_index: number;
  approved_at: string | null;
};

type Props = {
  milestones: Milestone[];
  brandColor: string | null;
};

const ACCENT_FALLBACK = "#1b1345";
const UNDO_WINDOW_MS = 5000;

function isHex(c: string | null): c is string {
  return c !== null && /^#[0-9A-Fa-f]{6}$/.test(c);
}

export function ClientMilestoneList({ milestones, brandColor }: Props) {
  const accent = isHex(brandColor) ? brandColor : ACCENT_FALLBACK;

  return (
    <ol className="flex flex-col gap-3">
      {milestones.map((m, idx) => (
        <ClientMilestoneRow
          key={m.id}
          milestone={m}
          index={idx}
          total={milestones.length}
          accent={accent}
        />
      ))}
    </ol>
  );
}

function ClientMilestoneRow({
  milestone,
  index,
  total,
  accent,
}: {
  milestone: Milestone;
  index: number;
  total: number;
  accent: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  // Stato locale per "approvato di recente" → mostra undo button
  const [recentApprovedAt, setRecentApprovedAt] = useState<number | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const isDelivered = milestone.status === "delivered";
  const isApproved = milestone.status === "approved";
  const isPending = milestone.status === "todo" || milestone.status === "in_progress";

  const onApprove = () => {
    startTransition(async () => {
      const r = await approveMilestoneAction({ milestone_id: milestone.id });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const approvedAt = Date.now();
      setRecentApprovedAt(approvedAt);
      toast.success("Approvata. Hai 5 secondi per annullare.", {
        action: {
          label: "Annulla",
          onClick: () => onUndo(),
        },
        duration: UNDO_WINDOW_MS,
      });
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => {
        setRecentApprovedAt(null);
        router.refresh();
      }, UNDO_WINDOW_MS);
    });
  };

  const onUndo = () => {
    startTransition(async () => {
      const r = await undoApproveMilestoneAction({ milestone_id: milestone.id });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRecentApprovedAt(null);
      toast.success("Approvazione annullata.");
      router.refresh();
    });
  };

  const onRequestRevision = () => {
    if (revisionText.trim().length === 0) return;
    startTransition(async () => {
      const r = await requestMilestoneRevisionAction({
        milestone_id: milestone.id,
        comment: revisionText.trim(),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Richiesta inviata. Il freelance la riceverà via email.");
      setRevisionOpen(false);
      setRevisionText("");
      router.refresh();
    });
  };

  // recentApprovedAt è azzerato dal timer schedulato in onApprove dopo
  // UNDO_WINDOW_MS, quindi basta il check non-null.
  const showUndoChip = isApproved && recentApprovedAt !== null;

  const statusLabel = MILESTONE_STATUS_LABELS[milestone.status as MilestoneStatus] ?? milestone.status;

  return (
    <li
      id={`m-${milestone.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-surface-container-lowest p-5 scroll-mt-24",
        isDelivered && "border-[--accent] shadow-[0_0_0_1px_var(--accent)]"
      )}
      style={{ ["--accent" as string]: accent } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Bullet status={milestone.status} accent={accent} />
          <div className="flex flex-col">
            <p className="text-[11px] uppercase tracking-wider text-on-surface-variant">
              Fase {index + 1} di {total}
            </p>
            <h3 className="font-heading text-h3 text-foreground">{milestone.title}</h3>
            {milestone.description && (
              <p className="mt-1 text-sm text-on-surface-variant">{milestone.description}</p>
            )}
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: isDelivered
              ? `${accent}1a`
              : isApproved
                ? "#dcecdb"
                : "var(--surface-container)",
            color: isDelivered ? accent : isApproved ? "#0c4626" : "var(--on-surface-variant)",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {isDelivered && !showUndoChip && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            type="button"
            disabled={pending}
            onClick={onApprove}
            style={{ backgroundColor: accent, color: "#ffffff" }}
            className="gap-2 hover:opacity-90"
          >
            {pending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2Icon className="h-4 w-4" />
            )}
            Approva consegna
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setRevisionOpen(true)}
            className="gap-2"
          >
            <MessageSquareIcon className="h-4 w-4" />
            Richiedi modifiche
          </Button>
        </div>
      )}

      {showUndoChip && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm text-on-surface-variant">Approvazione registrata.</span>
          <Button type="button" variant="outline" onClick={onUndo} disabled={pending}>
            Annulla approvazione
          </Button>
        </div>
      )}

      {isPending && (
        <p className="pt-1 text-sm text-on-surface-variant">
          Riceverai una notifica quando questa fase sarà pronta per la tua approvazione.
        </p>
      )}

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Richiedi modifiche</DialogTitle>
            <DialogDescription>
              Il freelance riceverà il tuo commento via email e nella chat del workspace.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={revisionText}
            onChange={(e) => setRevisionText(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Cosa vorresti cambiare? Es. 'Sul colore del menu preferirei un grigio più caldo'."
            className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="ghost" disabled={pending}>
                  Annulla
                </Button>
              }
            />
            <Button
              type="button"
              onClick={onRequestRevision}
              disabled={pending || revisionText.trim().length === 0}
            >
              {pending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
              Invia richiesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function Bullet({ status, accent }: { status: string; accent: string }) {
  const isDone = status === "approved" || status === "delivered";
  const isInProgress = status === "in_progress";
  const fill = isDone ? accent : isInProgress ? `${accent}66` : "transparent";
  const border = isDone || isInProgress ? accent : "var(--outline-variant)";
  return (
    <span
      className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
      style={{ backgroundColor: fill, borderColor: border }}
      aria-hidden="true"
    />
  );
}
