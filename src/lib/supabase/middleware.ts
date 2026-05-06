import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Refresh sessione lato middleware. Va eseguito su ogni request matched
 * dal middleware matcher. Restituisce la response (eventualmente modificata
 * con cookies aggiornati) e l'oggetto user (null se non autenticato).
 *
 * IMPORTANTE: non scrivere logica di redirect QUI — fallo nel chiamante
 * dopo aver controllato user. Vedi src/middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANTE: getUser() fa una network call e valida il JWT contro Supabase.
  // Non sostituire mai con getSession() (legge il cookie senza validazione).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
