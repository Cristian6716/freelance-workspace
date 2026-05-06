"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  GripVerticalIcon,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn, formatDateIT, formatEUR } from "@/lib/utils";
import {
  MILESTONE_STATUS_LABELS,
  type MilestoneStatus,
} from "@/lib/validation/schemas";
import {
  deleteMilestoneAction,
  reorderMilestonesAction,
  updateMilestoneStatusAction,
} from "@/actions/milestones";

export type MilestoneItem = {
  id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  amount: number | null;
  notes_internal: string | null;
  completed_at: string | null;
  approved_at: string | null;
};

const STATUSES: MilestoneStatus[] = ["todo", "in_progress", "delivered", "approved"];

const STATUS_BORDER: Record<MilestoneStatus, string> = {
  todo: "border-l-outline-variant",
  in_progress: "border-l-primary-container",
  delivered: "border-l-emerald-500",
  approved: "border-l-emerald-600",
};

const STATUS_PILL_BG: Record<MilestoneStatus, string> = {
  todo: "bg-surface-variant text-on-surface-variant",
  in_progress: "bg-secondary-container text-on-primary-container",
  delivered: "bg-emerald-100 text-emerald-900",
  approved: "bg-emerald-600 text-white",
};

export function MilestoneList({
  initial,
  projectId,
}: {
  initial: MilestoneItem[];
  projectId: string;
}) {
  // initial cambia col router.refresh(); rimountiamo il list-state usando una key
  // derivata dal join degli IDs nell'ordine corrente. Niente useEffect→setState.
  const remountKey = initial.map((m) => m.id).join("|");
  return (
    <MilestoneListBody
      key={remountKey}
      initial={initial}
      projectId={projectId}
    />
  );
}

function MilestoneListBody({
  initial,
  projectId,
}: {
  initial: MilestoneItem[];
  projectId: string;
}) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // ottimistico

    startTransition(async () => {
      const result = await reorderMilestonesAction({
        project_id: projectId,
        ordered_ids: next.map((i) => i.id),
      });
      if (!result.ok) {
        toast.error("Impossibile salvare il nuovo ordine");
        setItems(items); // rollback
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-outline-variant bg-card/40 px-6 py-10 text-center">
        <p className="font-heading text-h3 text-foreground">Nessuna milestone</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Aggiungi la prima milestone con il bottone qui sotto.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="grid gap-3" aria-busy={pending}>
          {items.map((m) => (
            <SortableMilestone key={m.id} milestone={m} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableMilestone({
  milestone,
}: {
  milestone: MilestoneItem;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: milestone.id,
  });
  const [pending, startTransition] = useTransition();
  const [statusOpen, setStatusOpen] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.85 : 1,
  };

  const onUpdateStatus = (next: MilestoneStatus) => {
    setStatusOpen(false);
    startTransition(async () => {
      const r = await updateMilestoneStatusAction({ id: milestone.id, status: next });
      if (!r.ok) toast.error(r.error);
    });
  };

  const onDelete = () => {
    if (!confirm(`Eliminare la milestone "${milestone.title}"?`)) return;
    startTransition(async () => {
      const r = await deleteMilestoneAction(milestone.id);
      if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-outline-variant/60 sm:flex-row sm:items-start sm:gap-4",
        "border-l-4",
        STATUS_BORDER[milestone.status]
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Trascina per riordinare"
          className="cursor-grab touch-none text-on-surface-variant hover:text-foreground active:cursor-grabbing"
        >
          <GripVerticalIcon className="h-5 w-5" />
        </button>
        <StatusOrb status={milestone.status} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{milestone.title}</h4>
        {milestone.description && (
          <p className="mt-1 text-sm text-on-surface-variant">{milestone.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
          {milestone.due_date && <span>Scadenza: {formatDateIT(milestone.due_date)}</span>}
          {milestone.completed_at && (
            <span>Consegnata: {formatDateIT(milestone.completed_at)}</span>
          )}
          {milestone.approved_at && (
            <span className="text-emerald-700">Approvata: {formatDateIT(milestone.approved_at)}</span>
          )}
        </div>
        {milestone.notes_internal && milestone.status === "in_progress" && (
          <div className="mt-3 rounded-md bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
            <p className="font-semibold uppercase tracking-wider mb-1 text-[10px]">
              Note interne
            </p>
            <p>{milestone.notes_internal}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 sm:min-w-[160px]">
        {milestone.amount !== null && (
          <span className="num-tabular text-sm font-medium text-foreground">
            {formatEUR(milestone.amount)}
          </span>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((s) => !s)}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-opacity",
              STATUS_PILL_BG[milestone.status],
              pending && "opacity-60"
            )}
          >
            {pending ? <Loader2Icon className="h-3 w-3 animate-spin" /> : null}
            {MILESTONE_STATUS_LABELS[milestone.status]}
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {statusOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 grid w-44 gap-0.5 rounded-md bg-popover p-1 ring-1 ring-foreground/10 shadow-md"
              role="menu"
            >
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateStatus(s)}
                  className={cn(
                    "flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-surface-variant",
                    s === milestone.status && "font-semibold"
                  )}
                >
                  {s === milestone.status && <CheckIcon className="h-3 w-3" />}
                  <span className={s === milestone.status ? "" : "ml-5"}>
                    {MILESTONE_STATUS_LABELS[s]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Elimina milestone"
          className="text-on-surface-variant hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function StatusOrb({ status }: { status: MilestoneStatus }) {
  const cls = cn(
    "h-9 w-9 shrink-0 rounded-full border-2 flex items-center justify-center",
    status === "todo" && "border-outline-variant",
    status === "in_progress" && "border-primary-container bg-primary-container/30",
    status === "delivered" && "border-emerald-500 bg-emerald-100",
    status === "approved" && "border-emerald-600 bg-emerald-600 text-white"
  );
  return (
    <span className={cls} aria-hidden="true">
      {status === "approved" && <CheckIcon className="h-4 w-4" />}
      {status === "delivered" && <CheckIcon className="h-4 w-4 text-emerald-600" />}
      {status === "in_progress" && <CircleIcon className="h-3 w-3 fill-current text-primary-container" />}
    </span>
  );
}
