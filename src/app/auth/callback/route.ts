import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth (Google, futuri provider).
 * Supabase reindirizza qui con `code` da scambiare per la sessione.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";

  // Sanifica next (solo path interni)
  const safeNext =
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.includes("..")
      ? nextParam
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=oauth_missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent("oauth_exchange_failed")}`
    );
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
