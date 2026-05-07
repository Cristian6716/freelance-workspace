import "server-only";

import { cache } from "react";

import type { Branding } from "@/lib/resend/templates/base";
import type { ClientSession } from "@/lib/client-session";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Bundle dati base per il layout cliente: branding del freelance owner +
 * dati workspace + email membro corrente. Centralizzato qui per essere
 * deduplicato via `cache()` ed evitare query ridondanti in layout/pagine.
 *
 * NIENTE PII oltre l'email corrente: niente leak di altri membri o di dati
 * di workspace diversi.
 */

export type ClientLayoutData = {
  workspace: {
    id: string;
    clientName: string;
    clientEmail: string | null;
    status: string;
  };
  member: {
    id: string;
    email: string;
    acceptedAt: string | null;
  };
  branding: Branding;
};

export const loadClientLayoutData = cache(
  async (session: ClientSession): Promise<ClientLayoutData | null> => {
    const admin = createServiceClient();

    const [{ data: ws }, { data: member }] = await Promise.all([
      admin
        .from("client_workspaces")
        .select(
          "id, client_name, client_email, status, owner_id, profiles!client_workspaces_owner_id_fkey(full_name, logo_url, brand_color, subscription_tier)"
        )
        .eq("id", session.workspaceId)
        .maybeSingle(),
      admin
        .from("workspace_members")
        .select("id, email, accepted_at, workspace_id")
        .eq("id", session.memberId)
        .maybeSingle(),
    ]);

    // Verifica che workspace_member appartenga al workspace della sessione.
    // Difesa in profondità: se il claim "ws" del JWT viene tamperato e non
    // matcha il record DB, blocchiamo.
    if (
      !ws ||
      !member ||
      member.workspace_id !== session.workspaceId ||
      ws.id !== session.workspaceId
    ) {
      return null;
    }

    const owner = ws.profiles as
      | {
          full_name: string | null;
          logo_url: string | null;
          brand_color: string | null;
          subscription_tier: string;
        }
      | null;

    return {
      workspace: {
        id: ws.id,
        clientName: ws.client_name,
        clientEmail: ws.client_email,
        status: ws.status,
      },
      member: {
        id: member.id,
        email: member.email,
        acceptedAt: member.accepted_at,
      },
      branding: {
        freelanceName: owner?.full_name?.trim() || "Il tuo freelance",
        freelanceLogoUrl: owner?.logo_url ?? null,
        brandColor: owner?.brand_color ?? null,
        isStudioTier: owner?.subscription_tier === "studio",
      },
    };
  }
);
