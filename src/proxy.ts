import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workspace",
  "/fatture",
  "/settings",
  "/billing",
];
const GUEST_PREFIXES = ["/signin", "/signup", "/forgot-password"];
const ONBOARDING_PREFIX = "/onboarding";
const CLIENT_PREFIX = "/client"; // route group (client) gestita da auth custom (Batch C)

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, supabase, user } = await updateSession(request);

  // /client/* è gestito da sessione custom in Batch C — qui passa-attraverso.
  if (pathname.startsWith(CLIENT_PREFIX)) {
    return response;
  }

  const isProtected = startsWithAny(pathname, PROTECTED_PREFIXES);
  const isGuest = startsWithAny(pathname, GUEST_PREFIXES);
  const isOnboarding =
    pathname === ONBOARDING_PREFIX || pathname.startsWith(`${ONBOARDING_PREFIX}/`);

  // Non autenticato
  if (!user) {
    if (isProtected || isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Autenticato sulle pagine guest → manda a dashboard
  if (isGuest) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Per tutte le altre route protected/root: serve onboarding completato.
  // Sull'onboarding stesso, non interveniamo: la /onboarding page decide
  // quale step renderizzare e redirige a /dashboard se tutto è già fatto.
  if (isProtected || pathname === "/") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("vertical, full_name, vat_number, fiscal_regime")
      .eq("id", user.id)
      .maybeSingle();

    const profileComplete =
      !!profile?.vertical &&
      !!profile?.full_name &&
      !!profile?.vat_number &&
      !!profile?.fiscal_regime;

    if (!profileComplete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)).*)",
  ],
};
