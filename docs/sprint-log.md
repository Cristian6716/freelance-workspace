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
- I 15 template sono già nel DB pronti per essere consumati dal selector "+ Nuovo progetto" in Batch B.
- **Bug latente da diagnosticare in Batch B**: la prima INSERT in `client_workspaces` (più poi `workspace_members`) tentata in produzione ha restituito `Impossibile salvare` (GENERIC_ERROR). I dati Zod erano validi, l'utente autenticato. Sospetto policy RLS che non vede il workspace appena inserito quando la `is_workspace_owner` viene chiamata (read-after-write, anche se le query sono separate). Quando Batch B implementa il dialog "+ Nuovo workspace", verificare con logging server-side l'errore esatto di Supabase (`error.code` + `error.message`) per identificare causa esatta.

---

## Patch post-Batch A — onboarding 2-step (2026-05-06, stesso giorno)

**Trigger**: errore HTTP 431 dopo signup + decisione UX di rimuovere il forzato "primo workspace" dall'onboarding.

### Cambiamenti

1. **HTTP 431 fix** (commit `a8a7be8`):
   - Aggiunto `cross-env` come dev dep.
   - `package.json` scripts `dev` e `start` lanciano con `NODE_OPTIONS=--max-http-header-size=32768`.
   - **Causa**: cookie auth chunked di Supabase con project ref di 20 caratteri superavano il default Node di 16 KB sui request headers, causando il browser a non poter ricaricare le route post-login.

2. **Onboarding 2-step**:
   - Rimosso step 3 "Primo workspace cliente" (decisione founder: friction inutile, l'utente lo crea dal dashboard).
   - `completeStep2Action` ora reindirizza direttamente a `/dashboard`.
   - `OnboardingStep3` component, `completeStep3Action`, `skipStep3Action`, `onboardingStep3Schema` rimossi. `clientTypeEnum` mantenuto per riuso in Batch B.
   - `OnboardingTopBar` aggiornata: 2 step invece di 3, label "Passo 2 di 2".
   - Aggiunto logging server-side (`console.error`) sugli errori Supabase nelle Server Actions per diagnosi futura senza esporre PII al client.
   - ESLint override (`/* eslint-disable no-console */`) sul `scripts/rls-smoke-test.mjs` (script dev-only legittimamente verboso).

### Deviation dal PRD

PRD §Batch A descriveva esplicitamente uno step 3 con primo workspace. Decisione del founder di rimuoverlo per ridurre friction onboarding, dato che il dialog "+ Nuovo workspace" del dashboard (Batch B) coprirà lo stesso flow con campi più completi (telefono, P.IVA cliente, codice SDI, indirizzo).

### Validazione

- ✓ `npm run lint` clean (0 errors, 0 warnings)
- ✓ `npm run typecheck` clean
- ✓ `npm run build` succeed (7 routes, 1 in meno per /onboarding sempre, ma stessa file count visto che era un'unica page)
- ✓ Flow: signup → step 1 → step 2 → /dashboard (atteso, da validare nel browser dopo restart dev)

---

## Batch B — Workspace core (2026-05-06)

**Obiettivo PRD §Batch B:** dashboard freelance funzionante, vista workspace con tab progetti/file/messaggi, CRUD progetti+milestone con drag-drop, upload file con versioning, chat realtime.

### Cosa è stato costruito

- **Dashboard**:
  - Layout `(dashboard)/layout.tsx` con sidebar 240px (Server Component) + top bar (Client Component) + drawer mobile.
  - Sidebar: nav Dashboard / Fatture / Impostazioni / Piano (le ultime 3 in coming-soon), user-card con tier.
  - Dashboard page con 3 stat card (workspace attivi, fatture in attesa, incassato del mese), filter pills, grid responsive 1→3 colonne di workspace card.
  - Workspace card con avatar deterministic (colore da hash su client_name), badge tipo, contatori progetti/fatture, barra avanzamento, "Aggiornato N tempo fa".
  - Dialog "+ Nuovo workspace cliente" con form completo (nome, tipo, email, phone, P.IVA, SDI, indirizzo expandable). Validazione Zod client + server, P.IVA condizionalmente required per company/PA.

- **Vista workspace `/workspace/[id]`**:
  - Layout `[id]/layout.tsx` con breadcrumb, header (avatar L, anagrafica, badge tipo + P.IVA + email + città), tabs orizzontali, layout 2-col 70/30 con sidebar destra sticky.
  - Sidebar destra: card "Riepilogo cliente" (progetti totali, fatturato, in attesa, cliente da, tempo medio pagamento) + card "Attività recenti" (10 ultimi eventi da `workspace_activity_log`).
  - Tabs: Progetti (default), File, Messaggi, Fatture (placeholder), Impostazioni (placeholder).

- **Progetti**:
  - List page con filter pills (Tutti / Attivi / Completati / Bozze) e contatori.
  - Project card con badge tipo (lavanda/sky/grigio), status pill, timeline milestone con cerchi (vuoto/mezzo/pieno) per deliverable, timeline mensile per recurring.
  - Dialog "+ Nuovo progetto" con scelta tipo deliverable/recurring, select template filtrato per verticale del freelance, importi/date.
  - Project detail page con header card (badge, status, descrizione, stat: importo, avanzamento %, date), milestone list con drag-drop (@dnd-kit/sortable), card "+ Nuova milestone".
  - Milestone CRUD: status flow todo → in_progress → delivered → approved con timestamp completed_at/approved_at, dropdown menu per cambio stato, delete con conferma, drag-drop reorder con persist immediato.

- **File**:
  - Bucket `workspace-files` privato (100MB, mime list ampia: immagini, PDF, Office, archivi, video, audio).
  - Storage RLS policies path `{workspace_id}/{file_id}` con check via `private.is_workspace_member`/`is_workspace_owner`.
  - Magic-byte verification estesa (PDF, ZIP/Office, 7z, video MP4/MOV/WebM, audio MP3/WAV) + scan binary content sui file dichiarati text-like.
  - Versioning: stesso (workspace, project, filename) → version = max+1.
  - File card con icona contestuale (image/pdf/video/audio/archive/generic), badge visibility/progetto, anteprima inline (image + PDF iframe sandbox), download via signed URL 1h, toggle visibility, soft delete.
  - Drag-drop area + click-to-select.

- **Messaggi**:
  - Stream chat con bubble allineate (owner = right, blu primary; altri = left, card outline).
  - Form input textarea con Cmd/Ctrl+Invio, select tag a progetto.
  - Realtime subscription Supabase su `messages` filtrata per `workspace_id=eq.{id}` (publication aggiornata in migration).
  - Group by giorno (Oggi / Ieri / data IT).

- **Activity log**:
  - Tabella `workspace_activity_log` con event_type, entity_type, metadata jsonb. Trigger SECURITY DEFINER su projects/milestones/files/messages, popolano l'event log automaticamente con `auth.uid()` come actor.
  - SELECT policy: solo membri workspace; INSERT/UPDATE/DELETE non esposti via API (solo i trigger DB scrivono).

### Decisioni rispetto al PRD

- **Member-row dell'owner rimossa dal modello dati**: l'owner è identificato esclusivamente da `client_workspaces.owner_id`. La tabella `workspace_members` resta per i guest invitati via magic link (`role='client'`) — sarà popolata in Batch C. `private.is_workspace_member` già riconosce l'owner via owner_id, quindi nessuna policy è impattata.
- **`messages.sender_profile_id` aggiunto** (migration `20260506115705_messages_sender_profile.sql`) per supportare messaggi inviati dall'owner senza bisogno di una member-row. Constraint check "exactly one sender column non-null" più policy INSERT updateda per accettare entrambi i path.
- **Realtime**: messages è in `supabase_realtime` publication; gli altri workspace event sono via SQL polling on-demand (no realtime overhead inutile).
- **Storage path convention `{workspace_id}/{uuid}`** invece di `{workspace_id}/{project_id}/{filename}` per evitare collisioni e semplificare RLS storage (basta foldername[1] = workspace_id).
- **Charts in Batch B = NO**: la "barra avanzamento aggregato" è realizzata con CSS flex/width, niente Recharts (Batch D).
- **Dialog "+ Nuovo workspace" non include la creazione di workspace_members** (vedi punto 1).

### Bug Batch A diagnosticato e fixato

Sintomo: in produzione (provato nell'ex-step-3 onboarding), `INSERT INTO client_workspaces ... RETURNING *` falliva sempre con 42501 mentre l'INSERT bare passava.

Causa REALE (diagnosticata in Batch B, NON race multi-statement come ipotizzato):
- La SELECT policy `workspaces_select_member` chiama `private.is_workspace_member(id, auth.uid())`, funzione **STABLE**.
- Dentro `INSERT...RETURNING`, la valutazione della SELECT policy avviene nello stesso statement.
- La funzione STABLE usa la snapshot dello statement, presa **prima** dell'INSERT — quindi non vede la riga appena inserita per il check `where w.id = workspace_uuid and w.owner_id = user_uuid`.
- Risultato: `is_workspace_member` ritorna false → SELECT bloccata → 42501 sull'INSERT.

Fix: migration `20260506115034_fix_workspaces_select_returning.sql` riscrive la policy `workspaces_select_member` per valutare `owner_id = auth.uid()` direttamente sulla colonna della NEW row (Postgres lo risolve dal RETURNING) + EXISTS subquery inline su `workspace_members`. Niente più chiamata alla helper STABLE per questo check specifico. Le altre policy che usano `is_workspace_member` (su tabelle figlie) NON hanno il problema perché il workspace già esisteva prima.

Verifica: T10 dello smoke test RLS riproduce il bug (insert+RETURNING) e ora passa.

### Sicurezza & RLS

- ✓ 11/11 RLS smoke test (workspace/profile/project/milestone/file/message/activity isolation; cross-user insert blocked; storage cross-tenant blocked; createWorkspace via RLS funzionante).
- ✓ Advisor: solo `auth_leaked_password_protection` (toggle dashboard, non in scope codice).
- ✓ Trigger SECURITY DEFINER tutti con `set search_path = ''` lockato.
- ✓ Magic-byte check su tutti i file uploaded (no MIME spoofing); rejection di binary content travestito da text/*.
- ✓ Path convention storage validata da policy (foldername[1] = workspace UUID di cui sei membro/owner).
- ✓ Signed URL expiry 1h per download/preview.
- ✓ ZIP family allowed solo se MIME dichiarato corrisponde a una famiglia attesa (Office/zip/x-zip).
- ✓ MAX_WORKSPACE_FILE_BYTES 100MB enforced client + server + bucket level + DB constraint (500MB hard ceiling).
- ✓ Tutte le Server Action con logging `console.error("[domain/op]:", error.code, error.message)` su errori Supabase, niente PII loggato.

### Vulnerabilità note (accettate)

- 6 moderate npm audit (postcss < 8.5.10) ereditati da Batch A. Re-check ad ogni upgrade Next.

### Validazione end-to-end

- ✓ `npm run lint` clean
- ✓ `npm run typecheck` clean (con `noUncheckedIndexedAccess` + `noImplicitReturns`)
- ✓ `npm run build` succeed: 11 routes (dashboard, workspace/[id], workspace/[id]/files, workspace/[id]/messages, workspace/[id]/projects/[projectId], + le 6 di Batch A)
- ✓ RLS smoke test 11/11 (workspace + profile + projects + milestones + files + messages + activity_log isolation; cross-user blocks; storage cross-tenant; createWorkspace bug fix verifica)
- ✓ Supabase advisor: only `auth_leaked_password_protection` warn (atteso)
- ✓ Realtime publication include `public.messages`
- ✓ Storage bucket `workspace-files` con file_size_limit + allowed_mime_types corretti
- ✓ Mobile-first: sidebar 240px collassa in drawer sotto 1024px, sidebar destra workspace stacca sotto 1024px

### Cose lasciate per Batch C+

- Vista cliente `/client/[token]` (Batch C) — il proxy ha già pass-through per `/client/*`.
- Email notification al cliente per nuovo messaggio (Batch C/F).
- Stripe billing + tier limits (Batch E) — il subscription_tier in profile è hardcoded `free`.
- Recharts su dashboard (Batch D).
- Real fatture page (Batch D) — placeholder tab.
- Drag-drop file con anteprima multi-file batch (V2).
- Lettura messaggi cliente + indicatore "letto" reale (Batch C; il `read_at` è già in DB).
- Calendario ricorrenze per progetti recurring (V2).

### Migrations Batch B

1. `20260506113606_batch_b_workspace_core.sql`: bucket `workspace-files`, storage policy, `workspace_activity_log` + RLS + trigger su projects/milestones/files/messages, indici performance, realtime publication su messages.
2. `20260506115034_fix_workspaces_select_returning.sql`: fix bug 42501 su INSERT...RETURNING per client_workspaces (vedi sopra).
3. `20260506115705_messages_sender_profile.sql`: aggiunge `messages.sender_profile_id` + constraint exactly-one + policy INSERT aggiornata per accettare path owner-via-profile.

### Tempo speso

- Pianificazione + diagnosi bug Batch A: ~25 min
- DB layer (3 migration + advisor + tipi + smoke test esteso): ~50 min
- Validation schemas + utilities: ~20 min
- Server Actions (workspaces, projects, milestones, files, messages): ~35 min
- Dashboard layout + sidebar + dialog + workspace card: ~45 min
- Workspace layout + header + tabs + right sidebar: ~30 min
- Project detail + milestone list con drag-drop: ~40 min
- File upload + storage + preview: ~35 min
- Chat + Realtime: ~25 min
- Validation e2e + lint fixes + sprint-log: ~25 min
- **Totale ~5h30m**
