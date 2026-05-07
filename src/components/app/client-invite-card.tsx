"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  MailIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  revokeClientMemberAction,
  sendClientInviteAction,
} from "@/actions/client-invites";
import { relativeTimeIT } from "@/lib/utils";

type Props = {
  workspaceId: string;
  clientEmail: string | null;
  existingMember: {
    id: string;
    email: string;
    invite_token: string;
    invited_at: string;
    accepted_at: string | null;
    last_seen_at: string | null;
  } | null;
  inviteUrl: string | null;
};

export function ClientInviteCard({
  workspaceId,
  clientEmail,
  existingMember,
  inviteUrl: initialInviteUrl,
}: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(initialInviteUrl);
  const [member, setMember] = useState(existingMember);
  const [pendingSend, startSend] = useTransition();
  const [pendingRotate, startRotate] = useTransition();
  const [pendingRevoke, startRevoke] = useTransition();
  const [copied, setCopied] = useState(false);

  const hasEmail = Boolean(clientEmail);

  const handleSend = () => {
    if (!hasEmail) {
      toast.error("Aggiungi prima un'email cliente nel workspace.");
      return;
    }
    startSend(async () => {
      const r = await sendClientInviteAction({ workspace_id: workspaceId });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setInviteUrl(r.inviteUrl);
      // Aggiorna member: se non esisteva, ora esiste.
      setMember((prev) => ({
        id: r.memberId,
        email: clientEmail!,
        invite_token: r.inviteUrl.split("/").pop()!,
        invited_at: new Date().toISOString(),
        accepted_at: prev?.accepted_at ?? null,
        last_seen_at: prev?.last_seen_at ?? null,
      }));
      if (r.emailStatus === "sent") {
        toast.success(`Invito inviato a ${clientEmail}.`);
      } else if (r.emailStatus === "skipped") {
        toast.success("Link generato. Email skippata (Resend non configurato).");
      } else {
        toast.warning("Link generato ma invio email fallito. Copia il link manualmente.");
      }
    });
  };

  const handleRotate = () => {
    if (
      !confirm(
        "Rigenerare il link invaliderà l'accesso attuale del cliente. Continuare?"
      )
    ) {
      return;
    }
    startRotate(async () => {
      const r = await sendClientInviteAction({
        workspace_id: workspaceId,
        rotate_token: true,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setInviteUrl(r.inviteUrl);
      setMember({
        id: r.memberId,
        email: clientEmail ?? "",
        invite_token: r.inviteUrl.split("/").pop()!,
        invited_at: new Date().toISOString(),
        accepted_at: null,
        last_seen_at: null,
      });
      toast.success(
        r.emailStatus === "sent"
          ? "Nuovo link generato e inviato via email."
          : "Nuovo link generato."
      );
    });
  };

  const handleRevoke = () => {
    if (!member) return;
    if (
      !confirm(
        "Revocare l'accesso? Il cliente non potrà più aprire il workspace finché non lo invii di nuovo."
      )
    ) {
      return;
    }
    startRevoke(async () => {
      const r = await revokeClientMemberAction(member.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setMember(null);
      setInviteUrl(null);
      toast.success("Accesso cliente revocato.");
    });
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copiato negli appunti.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copia non riuscita. Seleziona manualmente.");
    }
  };

  const status = !member
    ? "Non ancora invitato"
    : member.accepted_at
      ? `Cliente attivo${member.last_seen_at ? ` · ultimo accesso ${relativeTimeIT(member.last_seen_at)}` : ""}`
      : `Invito inviato ${relativeTimeIT(member.invited_at)} · in attesa di apertura`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-h3">Invita cliente</CardTitle>
          {member && (
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[11px]"
            >
              {member.accepted_at ? "Attivo" : "In attesa"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-on-surface-variant">
          Il cliente accede al workspace senza creare un account, tramite un link
          personale via email. Il link è valido 90 giorni dall&apos;ultimo accesso.
        </p>

        {!hasEmail && (
          <div className="rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
            Aggiungi un&apos;email cliente nei dati del workspace prima di inviare l&apos;invito.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-on-surface-variant">Stato:</span>
          <span className="font-medium">{status}</span>
        </div>

        {inviteUrl && (
          <div className="grid gap-2">
            <label
              htmlFor="invite-url"
              className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Link cliente
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="invite-url"
                readOnly
                value={inviteUrl}
                className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm font-mono"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
                {copied ? "Copiato" : "Copia link"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSend} disabled={pendingSend || !hasEmail}>
            {pendingSend ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <MailIcon className="h-4 w-4" />
            )}
            {member ? "Reinvia email" : "Invia invito email"}
          </Button>
          {member && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRotate}
                disabled={pendingRotate}
              >
                {pendingRotate ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                Rigenera link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRevoke}
                disabled={pendingRevoke}
                className="border-error/40 text-error hover:bg-error-container/40 hover:text-on-error-container"
              >
                {pendingRevoke ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <XIcon className="h-4 w-4" />
                )}
                Revoca accesso
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
