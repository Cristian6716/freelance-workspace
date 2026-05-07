import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT, errors as joseErrors } from "jose";

import { serverEnv } from "@/lib/env";

/**
 * Sessione cliente magic-link (Batch C).
 *
 * Il cliente NON usa Supabase Auth: dopo aver consumato un magic link via
 * `/client/{invite_token}`, riceve un cookie HttpOnly firmato HS256 con
 * `jose`. Il cookie ha path `/client` (non viaggia su altre route) e durata
 * 90 giorni rolling.
 *
 * Le query lato cliente NON si appoggiano a RLS auth.uid() (il client non ha
 * un auth.users row). Vanno SEMPRE fatte tramite SERVICE_ROLE con guard
 * manuale `record.workspace_id === session.workspaceId` (vedi PRD §1049).
 *
 * Claims minimi:
 *   - sub: workspace_member_id
 *   - ws:  workspace_id (denormalizzato per evitare JOIN extra ad ogni request)
 *   - iat: issued at
 *   - exp: expiration
 *
 * NIENTE PII (email, nome) nel token: usiamo il member_id per query downstream.
 */

const COOKIE_NAME = "nome_app_client_session";
const COOKIE_PATH = "/client";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 giorni
const JWT_ALG = "HS256";

export type ClientSession = {
  memberId: string;
  workspaceId: string;
  /** UNIX seconds */
  issuedAt: number;
  /** UNIX seconds */
  expiresAt: number;
};

type RawClaims = {
  sub: string;
  ws: string;
  iat: number;
  exp: number;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(serverEnv().MAGIC_LINK_JWT_SECRET);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/**
 * Firma un nuovo token di sessione cliente.
 * NON imposta il cookie: usa `setClientSessionCookie` per quello.
 */
export async function signClientSessionToken(
  memberId: string,
  workspaceId: string
): Promise<string> {
  if (!isUuid(memberId) || !isUuid(workspaceId)) {
    throw new Error("signClientSessionToken: memberId/workspaceId must be UUIDs");
  }
  return await new SignJWT({ ws: workspaceId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verifica un token di sessione cliente. Ritorna i claims se valido,
 * null se firma/expiry/shape non OK. NON logga il token (PII-adjacent).
 */
export async function verifyClientSessionToken(
  token: string
): Promise<ClientSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
    });
    const claims = payload as Partial<RawClaims>;
    if (
      !isUuid(claims.sub) ||
      !isUuid(claims.ws) ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }
    return {
      memberId: claims.sub,
      workspaceId: claims.ws,
      issuedAt: claims.iat,
      expiresAt: claims.exp,
    };
  } catch (err) {
    if (
      err instanceof joseErrors.JWTExpired ||
      err instanceof joseErrors.JWTInvalid ||
      err instanceof joseErrors.JWSSignatureVerificationFailed ||
      err instanceof joseErrors.JOSEError
    ) {
      return null;
    }
    // Errori inattesi: log senza il token in chiaro.
    console.error("[client-session/verify] unexpected error:", (err as Error).message);
    return null;
  }
}

/**
 * Imposta il cookie di sessione cliente (HttpOnly, path /client, 90 giorni).
 * Chiamabile solo da Server Action o Route Handler.
 */
export async function setClientSessionCookie(
  memberId: string,
  workspaceId: string
): Promise<void> {
  const token = await signClientSessionToken(memberId, workspaceId);
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Cancella il cookie di sessione cliente. Idempotente.
 * Chiamabile solo da Server Action o Route Handler.
 */
export async function clearClientSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

/**
 * Ritorna la sessione cliente corrente (se cookie valido), altrimenti null.
 * Da usare in pagine/Server Actions sotto `(client)`.
 */
export async function getClientSession(): Promise<ClientSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyClientSessionToken(token);
}

/**
 * Versione throwing di getClientSession: redirect a /client/expired se assente.
 * Da usare nelle pagine `(client)/...` che richiedono sessione.
 */
export async function requireClientSession(): Promise<ClientSession> {
  const session = await getClientSession();
  if (!session) {
    redirect("/client/expired?reason=no_session");
  }
  return session;
}

/**
 * Guard di workspace: verifica che la session corrente abbia accesso a
 * un determinato workspace_id. Throw redirect a /client/expired altrimenti.
 * Pattern centralizzato per evitare bypass nelle Server Actions cliente.
 */
export async function assertClientWorkspaceAccess(workspaceId: string): Promise<ClientSession> {
  const session = await requireClientSession();
  if (session.workspaceId !== workspaceId) {
    redirect("/client/expired?reason=wrong_workspace");
  }
  return session;
}
