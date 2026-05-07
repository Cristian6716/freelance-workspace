"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, SendIcon } from "lucide-react";

import {
  markClientMessagesReadAction,
  sendClientMessageAction,
} from "@/actions/client-mutations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateIT, initialsFor, relativeTimeIT } from "@/lib/utils";

export type ClientChatMessage = {
  id: string;
  body: string;
  sender_profile_id: string | null;
  sender_member_id: string | null;
  project_id: string | null;
  milestone_id: string | null;
  created_at: string;
};

type Project = { id: string; title: string };

type Props = {
  myMemberId: string;
  freelanceName: string;
  brandColor: string | null;
  projects: Project[];
  initialMessages: ClientChatMessage[];
};

const ACCENT_FALLBACK = "#1b1345";
const NO_PROJECT = "__none__";

function isHex(c: string | null): c is string {
  return c !== null && /^#[0-9A-Fa-f]{6}$/.test(c);
}

export function ClientChat({
  myMemberId,
  freelanceName,
  brandColor,
  projects,
  initialMessages,
}: Props) {
  const accent = isHex(brandColor) ? brandColor : ACCENT_FALLBACK;
  const [messages, addOptimistic] = useOptimistic(
    initialMessages,
    (state: ClientChatMessage[], pending: ClientChatMessage) => [...state, pending]
  );
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const markReadFired = useRef(false);

  // Mark as read al mount (best-effort; lato server controlla solo i messaggi
  // del freelance, cioè sender_member_id IS NULL).
  useEffect(() => {
    if (markReadFired.current) return;
    markReadFired.current = true;
    void markClientMessagesReadAction();
  }, []);

  // Polling 15s: il cliente non ha sessione Supabase Auth, niente realtime.
  // router.refresh() rivaluta il Server Component → nuove initialMessages.
  useEffect(() => {
    let stopped = false;
    const intervalId = setInterval(() => {
      if (!stopped) router.refresh();
    }, 15000);
    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || pending) return;

    const optimistic: ClientChatMessage = {
      id: `optimistic-${Date.now()}`,
      body: trimmed,
      sender_profile_id: null,
      sender_member_id: myMemberId,
      project_id: projectId === NO_PROJECT ? null : projectId,
      milestone_id: null,
      created_at: new Date().toISOString(),
    };

    startTransition(async () => {
      addOptimistic(optimistic);
      setBody("");
      const result = await sendClientMessageAction({
        body: trimmed,
        project_id: projectId === NO_PROJECT ? null : projectId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const grouped = groupByDay(messages);

  return (
    <div className="grid gap-3">
      <div
        ref={scrollRef}
        className="grid h-[60dvh] gap-4 overflow-y-auto rounded-xl bg-surface-container-low p-4"
        aria-live="polite"
        aria-label="Conversazione"
      >
        {messages.length === 0 ? (
          <div className="grid place-items-center text-center">
            <p className="font-heading text-h3 text-foreground">Nessun messaggio</p>
            <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
              Scrivi a {freelanceName} per iniziare la conversazione.
            </p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="grid gap-2">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {g.label}
                </span>
              </div>
              {g.messages.map((m) => {
                const fromMe = m.sender_member_id === myMemberId;
                return (
                  <Bubble
                    key={m.id}
                    message={m}
                    fromMe={fromMe}
                    freelanceName={freelanceName}
                    accent={accent}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="grid gap-2">
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
              }
            }}
            rows={2}
            placeholder={`Scrivi a ${freelanceName}…`}
            className="min-h-[3rem] flex-1 resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={8000}
          />
          <Button
            type="submit"
            disabled={pending || body.trim().length === 0}
            style={{ backgroundColor: accent, color: "#ffffff" }}
            className="shrink-0 hover:opacity-90"
          >
            {pending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            Invia
          </Button>
        </div>
      </form>
    </div>
  );
}

function Bubble({
  message,
  fromMe,
  freelanceName,
  accent,
}: {
  message: ClientChatMessage;
  fromMe: boolean;
  freelanceName: string;
  accent: string;
}) {
  return (
    <div className={cn("flex gap-2", fromMe ? "justify-end" : "justify-start")}>
      {!fromMe && (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: accent }}
          aria-hidden="true"
        >
          {initialsFor(freelanceName)}
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          fromMe
            ? "rounded-br-sm text-white"
            : "rounded-bl-sm bg-surface-container-lowest ring-1 ring-outline-variant/60"
        )}
        style={fromMe ? { backgroundColor: accent } : undefined}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px] uppercase tracking-wider",
            fromMe ? "text-white/70" : "text-on-surface-variant"
          )}
        >
          {relativeTimeIT(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function groupByDay(
  messages: ClientChatMessage[]
): { day: string; label: string; messages: ClientChatMessage[] }[] {
  const groups = new Map<string, ClientChatMessage[]>();
  for (const m of messages) {
    const d = new Date(m.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([key, msgs]) => {
    const first = msgs[0]!;
    return { day: key, label: dayLabelIT(new Date(first.created_at)), messages: msgs };
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
