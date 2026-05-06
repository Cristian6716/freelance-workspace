# Sprint Log

Diario di esecuzione dei batch. Una sezione per batch, append-only.

---

## Batch A — Fondamenta (2026-05-06)

**Obiettivo PRD §Batch A:** repo Next.js funzionante, schema DB con RLS, auth + onboarding 3-step.

### Cosa è stato costruito

- Repo Next.js 16.2.4 (Turbopack default) + TypeScript strict + Tailwind 4 + shadcn/ui base-nova.
- Palette Material You (decisione: HTML mockup come fonte di verità, vedi sotto).
- Font Newsreader (heading) + Inter (body) via `next/font`.
- Security headers (CSP strict + HSTS + COOP + Permissions-Policy + X-Frame-Options DENY) configurati in `next.config.ts`.
- Schema DB completo: 9 tabelle pubbliche + storage bucket `profile-logos`. Tutti i constraint (P.IVA 11 cifre, IBAN IT, regime fiscale, status enum, etc.) applicati a livello DB.
- RLS abilitata su tutte le tabelle. Helper `is_workspace_member`/`is_workspace_owner` in schema `private` (non esposto via PostgREST).
- Trigger `on_auth_user_created` crea automaticamente `profiles` quando arriva un `auth.users`.
- Seed `supabase/seed.sql` con 15 template realistici (3 per verticale × 5).
- Auth flow: signup/signin email+password + bottone Google dietro feature flag OFF.
- Onboarding 3-step: scelta verticale (HTML mockup), dati profilo (P.IVA + IBAN validati), primo workspace (skippabile).
- Validatori italiani: P.IVA con checksum AdE, IBAN con MOD-97.
- Magic-byte check sui file uploaded (logo profilo) per prevenire MIME spoofing.
- Email-enumeration prevention sul signup (errori generici).
- Smoke test RLS: 4/4 ✓ (cross-tenant SELECT, cross-tenant INSERT, profile isolation, templates catalog).

### Decisioni rispetto al PRD

- **Palette:** HTML mockup come fonte di verità invece dei valori in CLAUDE.md (originale). CLAUDE.md aggiornato di conseguenza con palette Material You completa.
- **Font:** Newsreader invece di Instrument Serif (coerenza con HTML mockup). Aggiornato CLAUDE.md.
- **Brand placeholder:** `[NOME_APP]` letterale ovunque finché non sarà scelto un nome definitivo.
- **Google OAuth:** implementato dietro feature flag `NEXT_PUBLIC_FEATURE_GOOGLE_AUTH=false`. Il pulsante mostra "Disponibile a breve" finché il flag è OFF. Tutta la pipeline (Server Action `signinWithGoogleAction`, route `/auth/callback`) è già pronta.
- **Helper RLS in schema `private`:** evita la WARN `anon_security_definer_function_executable` dell'advisor Supabase senza dover gestire bypass complicati. PostgREST espone solo schema `public` di default.
- **Policy mutate split:** `_mutate_owner` (FOR ALL) sostituite con policy separate INSERT/UPDATE/DELETE per evitare la WARN `multiple_permissive_policies` (la SELECT veniva valutata 2 volte).
- **Tipi PostgreSQL extension:** `extensions.citext` schema-qualificato (vedi convenzione Supabase, primo errore `type "citext" does not exist` risolto).
- **Convenzione middleware Next 16:** `src/proxy.ts` (function `proxy`) invece di `middleware.ts` (deprecato).
- **Versioning migrations:** timestamp full `YYYYMMDDhhmmss_*.sql` invece di `00001_*.sql` per coerenza con CLI Supabase moderna.

### Problemi incontrati e risoluzione

- **`citext` not found** in migration 00001: risolto schema-qualificando in `extensions.citext`.
- **Advisor warning su SECURITY DEFINER**: risolto migrando le 3 funzioni helper in schema `private` con migration 00004.
- **Advisor warning multiple_permissive_policies** su projects/milestones/invoices: risolto splittando le policy `FOR ALL` in 3 policy separate (INSERT, UPDATE, DELETE).
- **shadcn `add form` non funzionante** con preset base-nova (registry vuoto): scritto manualmente `src/components/ui/form.tsx` adattando il pattern classico shadcn ai primitive di base-nova.
- **`Select.onValueChange` tipi**: il primitive `@base-ui/react` accetta `string | null`. Wrappato con `(v) => setState(v ?? "")`.
- **TypeScript build error su `<claude-code-hint>`**: il generatore tipi Supabase appendeva un tag plugin alla fine; rimosso a mano (eventuale follow-up: hook post-`db:types` per strip automatico).
- **Next 16 `middleware.ts` deprecato**: rinominato in `src/proxy.ts`, function `proxy()`.

### Vulnerabilità note (accettate)

- `npm audit`: 6 moderate severity da `next > postcss < 8.5.10` (CVE GHSA-qx2v-qp2m-jg93 — XSS in CSS stringify). Attualmente la fix richiede Next 16.3+ (non ancora stabile). Build-time only, non sfruttabile dal nostro app dato che non usiamo postcss per stringify input utente. Re-check ad ogni upgrade Next.

### Validazione end-to-end

- ✓ `npm run lint` clean
- ✓ `npm run typecheck` clean
- ✓ `npm run build` succeed (9 routes generate)
- ✓ Security headers presenti su tutte le route (CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP)
- ✓ Redirect non-auth: `/` → `/signin`, `/dashboard` → `/signin?next=/dashboard`, `/onboarding` → `/signin?next=/onboarding`
- ✓ RLS smoke test 4/4 (workspace isolation, profile isolation, cross-user INSERT blocked, templates visibility)
- ✓ Supabase advisor: `No issues found`
- ✓ 15 template seed presenti (3 per verticale)
- ✓ Migrations applicate al progetto remoto `xtyuyciuqlxhgxrmruft`
- TODO **manual browser walk-through**: signup → onboarding step 1 → 2 (logo upload + P.IVA reale) → 3 (skip e create) → dashboard. Richiede config Supabase Auth dashboard:
  - **DISABILITARE** "Confirm email" in Authentication → Sign In / Up (oppure abilitarlo e testare il link).
  - Verificare che `Site URL` sia `http://localhost:3000` in dev.
  - Per Google OAuth (futuro flag ON): configurare Google Cloud Console + provider Supabase.

### Tempo speso

- Pianificazione + setup: ~15 min
- Schema DB + RLS + advisor fix: ~50 min
- Auth + onboarding + dashboard placeholder: ~75 min
- Validation + audit + RLS smoke test + docs: ~25 min
- **Totale ~2h45m** (vs stima PRD 2-4h Claude)

### Aperture per Batch B

- `/dashboard` è ora un placeholder con riepilogo profilo. Il vero layout con sidebar 240px arriva in Batch B.
- `client_workspaces` esiste con un solo record (creato in step 3 onboarding). La griglia "Workspace card" ancora da costruire.
- I 15 template sono già nel DB pronti per essere consumati dal selector "+ Nuovo progetto" in Batch B.
