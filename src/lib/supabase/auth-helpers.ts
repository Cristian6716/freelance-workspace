import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Restituisce user e profile correnti. user è null se non autenticato;
 * profile è null se l'utente non ha ancora un record profiles (caso transitorio
 * tra trigger e prima query) — il middleware reindirizza a /onboarding in tal caso.
 */
export async function getCurrentUserAndProfile(): Promise<{
  user: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"];
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

/**
 * Solo user, senza il roundtrip al profiles. Per casi in cui basta sapere
 * se l'utente è loggato.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
