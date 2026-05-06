import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client per Server Components, Server Actions, Route Handlers.
 * Usa i cookie del request per la sessione utente — soggetto a RLS.
 * Il setAll() può fallire silenziosamente nei Server Components: in tal caso
 * il refresh sessione avviene a livello middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component context: cookies() è readonly. Il middleware
            // si occupa del refresh, quindi non è un errore reale.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. BYPASSA RLS. Usare SOLO per operazioni admin
 * (cron, webhook handlers che mutano dati cross-tenant).
 * MAI esportare/usare in Client Components o passare al browser.
 */
export function createServiceClient() {
  const env = serverEnv();
  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op: service client è stateless, niente cookie.
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
