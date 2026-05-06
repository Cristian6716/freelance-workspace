"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendMessageAction } from "@/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDateIT, initialsFor, relativeTimeIT } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  sender_profile_id: string | null;
  sender_member_id: string | null;
  project_id: string | null;
  milestone_id: string | null;
  created_at: string;
};

type Project = { id: string; title: string };

const NO_PROJECT = "__none__";

type Props = {
  workspaceId: string;
  ownerProfileId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  projects: Project[];
  initialMessages: ChatMessage[];
};

export function WorkspaceChat({
  workspaceId,
  ownerProfileId,
  ownerName,
  ownerEmail,
  projects,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => {
            // Idempotenza: se già presente (da insert ottimistico), salta.
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  // Auto-scroll bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || pending) return;

    const fd = new FormData();
    fd.append("workspace_id", workspaceId);
    fd.append("body", trimmed);
    if (projectId !== NO_PROJECT) fd.append("project_id", projectId);

    startTransition(async () => {
      const result = await sendMessageAction(null, fd);
      if (result.ok) {
        setBody("");
        // Realtime arriverà l'evento; per evitare flicker non aggiungiamo qui.
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const groupedByDay = groupByDay(messages);

  return (
    <div className="grid gap-3">
      <div
        ref={scrollRef}
        className="grid h-[60dvh] gap-4 overflow-y-auto rounded-xl bg-surface-container-low p-4"
        aria-live="polite"
        aria-label="Conversazione workspace"
      >
        {messages.length === 0 ? (
          <div className="grid place-items-center text-center">
            <p className="font-heading text-h3 text-foreground">Nessun messaggio</p>
            <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
              Manda il primo messaggio. Il cliente lo vedrà nella sua vista (in arrivo
              col Batch C).
            </p>
          </div>
        ) : (
          groupedByDay.map((g) => (
            <div key={g.day} className="grid gap-2">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {g.label}
                </span>
              </div>
              {g.messages.map((m) => {
                const fromOwner = m.sender_profile_id === ownerProfileId;
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    fromOwner={fromOwner}
                    ownerName={ownerName}
                    ownerEmail={ownerEmail}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {projects.length > 0 && (
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? NO_PROJECT)}>
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder="Tagga progetto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>Nessun tag</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
              }
            }}
            rows={2}
            placeholder="Scrivi un messaggio… (Cmd/Ctrl+Invio per inviare)"
            className="min-h-[3rem] flex-1 resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={8000}
          />
          <Button type="submit" disabled={pending || body.trim().length === 0}>
            {pending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
            Invia
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  fromOwner,
  ownerName,
  ownerEmail,
}: {
  message: ChatMessage;
  fromOwner: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
}) {
  return (
    <div
      className={cn(
        "flex gap-2",
        fromOwner ? "justify-end" : "justify-start"
      )}
    >
      {!fromOwner && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-variant text-xs font-semibold text-on-surface-variant">
          ?
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          fromOwner
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card ring-1 ring-outline-variant/60 rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px] uppercase tracking-wider",
            fromOwner ? "text-primary-foreground/60" : "text-on-surface-variant"
          )}
        >
          {relativeTimeIT(message.created_at)}
        </p>
      </div>
      {fromOwner && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
          {initialsFor(ownerName, ownerEmail)}
        </span>
      )}
    </div>
  );
}

function groupByDay(messages: ChatMessage[]): { day: string; label: string; messages: ChatMessage[] }[] {
  const groups = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    const d = new Date(m.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([key, msgs]) => {
    const first = msgs[0]!;
    return {
      day: key,
      label: dayLabelIT(new Date(first.created_at)),
      messages: msgs,
    };
  });
}

function dayLabelIT(d: Date): string {
  const today = new Date();
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSame(d, today)) return "Oggi";
  if (isSame(d, yesterday)) return "Ieri";
  return formatDateIT(d);
}
