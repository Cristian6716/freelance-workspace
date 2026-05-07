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

---

## Batch C — Vista cliente (2026-05-07)

**Obiettivo PRD §Batch C:** vista cliente accessibile via magic link, branded
col profilo del freelance, con approvazione milestone, file shared, chat
bidirezionale, notifiche email.

### Decisioni materiali (con utente, prima di scrivere codice)

1. **JWT expiry**: 90 giorni rolling + step-up OTP `<24h` per azioni sensibili
   (Batch D fatture). Scelto su single-use 24h o 30 giorni multi-use.
2. **Auth path**: JWT custom HS256 con `jose`. NIENTE Supabase Auth per i
   clienti (no signup, no email verification, no password). Cookie HttpOnly
   `nome_app_client_session`, path `/client`.
3. **White-label**: solo logo + brand_color del freelance owner (letti da
   `profiles.logo_url` + `profiles.brand_color`). Footer "Workspace gestito
   con [NOME_APP]" nascosto SOLO per `subscription_tier='studio'`.
4. **Approve milestone UX**: 1-click immediato + toast con countdown 5s e
   bottone "Annulla" (gmail-style). Server `undoApproveMilestoneAction`
   accetta solo entro 30s grace dal `approved_at` (safety contro race).

### Niente migration DB

Le tabelle Batch A+B coprono già tutto: `workspace_members.invite_token` UUID
unique, `accepted_at`, `last_seen_at`, `messages.sender_member_id` con
constraint exactly-one. Le mutate lato cliente passano per SERVICE_ROLE +
guard manuale (PRD §1049: «le query lato cliente NON si appoggiano a RLS
auth.uid()»).

### Cosa è stato costruito

- **Lib `client-session.ts`** (`jose` HS256):
  - `signClientSessionToken(memberId, workspaceId)` → JWT con claims `{sub,ws,iat,exp}`.
  - `verifyClientSessionToken(token)` → null su qualunque error (JWTExpired,
    JWTInvalid, signature failed); niente token leak nei log.
  - `setClientSessionCookie` / `clearClientSessionCookie`: HttpOnly, Secure
    in prod, SameSite=Lax, path `/client`, max-age 90 giorni.
  - `getClientSession` / `requireClientSession` / `assertClientWorkspaceAccess`:
    guard centralizzati per pagine/Server Actions.

- **Lib `resend/`**:
  - `client.ts`: singleton `Resend` lazy.
  - `send.ts`: wrapper unico `sendEmail()`. Best-effort: niente throw,
    skip silenzioso se `RESEND_API_KEY` mancante (dev-friendly), log
    error.code/tag senza body/recipient.
  - `templates/base.ts`: `renderEmailShell` (table layout HTML inline,
    table+inline-CSS per compat Outlook/Gmail) + `ctaButton`.
  - 4 template: `client-invite`, `new-message`, `milestone-approved`,
    `milestone-revision`. Branded con logo+brand_color, italiano caldo,
    footer condizionale per studio tier.

- **Server Actions**:
  - `client-invites.ts` (lato freelance, auth Supabase):
    `sendClientInviteAction({workspace_id, rotate_token?})`,
    `revokeClientMemberAction(memberId)`. Crea/riusa `workspace_members`
    role='client', genera URL `/client/{invite_token}`, invia email.
  - `client-magic-link.ts` (lato cliente, no auth):
    `consumeMagicLinkAction(token)` → SERVICE_ROLE lookup + expiry check
    (>90 giorni `last_seen_at` → expired) + `setClientSessionCookie` +
    update `accepted_at`/`last_seen_at`. `clientLogoutAction` cancella
    cookie e redirect home.
  - `client-mutations.ts` (lato cliente, richiede session):
    `approveMilestoneAction`, `undoApproveMilestoneAction` (grace 30s
    server-side), `requestMilestoneRevisionAction` (insert message +
    email), `sendClientMessageAction`, `getClientSignedFileUrlAction`
    (doppio guard `visibility='shared' AND workspace_id` + signed URL 1h),
    `markClientMessagesReadAction`, `touchClientLastSeenAction`.
    Tutte le mutate iniziano con `requireClientSession()` e usano
    SERVICE_ROLE con guard manuale `record.workspace_id === session.workspaceId`.

- **UI lato freelance**:
  - Tab "Impostazioni" abilitata.
  - `/(dashboard)/workspace/[id]/settings/page.tsx` con `ClientInviteCard`:
    bottone "Invia invito email", "Reinvia", "Rigenera link"
    (rotate_token=true), "Revoca accesso", input readonly URL + copia
    clipboard, badge stato (in attesa / attivo / ultimo accesso).
  - `WorkspaceHeader`: bottone "Apri vista cliente" rimpiazzato con
    "Invita cliente" che linka a `settings#invite` (era `disabled` in B).
  - `WorkspaceTabs`: badge unread sulla tab "Messaggi" che conta i
    `messages` con `read_at IS NULL AND sender_member_id IS NOT NULL`
    (cioè scritti dal cliente).
  - `markMessagesReadAction` aggiornata: ora marca solo i messaggi del
    CLIENTE, non quelli inviati dal freelance stesso.
  - `MarkMessagesReadMount` Client Component triggera la mark-read al
    mount della tab Messaggi.

- **UI lato cliente** (`(client)/`):
  - `layout.tsx`: branded chrome (sfondo `#FAF7F2`, topbar+footer). Se
    `getClientSession()` è null, layout MINIMO (per `[token]` consumer e
    `expired`). Se presente, fetch dati via `loadClientLayoutData(session)`
    (memoizzato con `cache()`) + count unread + `<TouchLastSeen />`.
  - `ClientTopbar`: logo+nome freelance a sx, nav (Panoramica/Progetti/
    File/Messaggi/Fatture) con accent color brand, email cliente + form
    POST `clientLogoutAction` a dx, badge unread sulla tab Messaggi.
  - `ClientFooter`: "Workspace gestito con [NOME_APP]" nascosto per studio.
  - `[token]/page.tsx`: validazione UUID + render `<ConsumeMagicLink>` che
    al mount chiama `consumeMagicLinkAction`, set cookie, redirect `/client`.
    Strict-mode safe (ref guard contro double-mount).
  - `expired/page.tsx`: 5 reason copy distinte (expired / invalid / revoked
    / no_session / wrong_workspace) con CTA "Torna alla home".
  - `page.tsx` (panoramica): hero "BENTORNATO + Ciao {clientName}, ecco a
    che punto siamo", grid 60/40 con `ClientProjectCard` (top 3 progetti
    attivi) + sezione "Cosa serve da te" (lista milestone delivered con
    deep-link `#m-{id}`) + sidebar Riepilogo / Ultima fattura placeholder
    / Messaggio recente.
  - `projects/page.tsx`: lista raggruppata per status (Attivi / Completati
    / Archiviati) con `ClientProjectCard`.
  - `projects/[projectId]/page.tsx`: detail con header (badge tipo+status,
    importo/date), `ClientMilestoneList` (bullet visuale per status, per
    ogni `delivered` bottone "Approva consegna" + "Richiedi modifiche"
    con dialog), file shared del progetto.
  - `ClientMilestoneList` (Client Component): approve = optimistic +
    timer 5s, durante il quale è visibile "Annulla approvazione" che
    chiama `undoApproveMilestoneAction`. Revisione: dialog con textarea,
    submit chiama action che inserisce un messaggio + email freelance.
  - `files/page.tsx`: lista file shared raggruppata per progetto con
    `ClientFileRow` (download via `getClientSignedFileUrlAction`,
    icona contestuale per mime type).
  - `messages/page.tsx`: `ClientChat` con bubble cliente a destra (brand
    color), freelance a sinistra. `useOptimistic` per pending message,
    polling 15s (no realtime per anonimi), `markClientMessagesReadAction`
    al mount.
  - `invoices/page.tsx`: placeholder "In arrivo" (Batch D).

### Sicurezza & RLS

- ✓ Cookie sessione: HttpOnly + Secure (prod) + SameSite=Lax + Path=/client
  + maxAge 90 giorni. Niente localStorage.
- ✓ JWT HS256 con secret distinto da `ENCRYPTION_KEY`/SUPABASE keys.
- ✓ Claims minimi: `sub` (memberId), `ws` (workspaceId), `iat`, `exp`.
  Nessuna PII (no email, no nome).
- ✓ Verify gestisce JWTExpired/JWTInvalid/JWSSignatureVerificationFailed
  separatamente con catch-all → null. Niente token nei log.
- ✓ Tutte le Server Actions cliente passano per `requireClientSession()` +
  guard manuale `workspace_id === session.workspaceId` su ogni risorsa.
- ✓ `undoApproveMilestoneAction`: grace 30s server-side per evitare
  race con tab chiuse / azione tardiva.
- ✓ File download: `visibility='shared'` + `workspace_id matching` +
  `deleted_at IS NULL` prima di `createSignedUrl(3600)`.
- ✓ `assertClientWorkspaceAccess(workspaceId)` esposta come pattern per
  pagine future con workspaceId in URL.
- ✓ `loadClientLayoutData` verifica che `member.workspace_id === session.workspaceId`
  → difesa in profondità contro JWT tampering del claim `ws`.
- ✓ Email best-effort: niente throw mai, log error.code soltanto.
- ✓ Constraint DB exactly-one sender (T13 smoke): doppio sender bloccato.
- ✓ `workspace_members.invite_token` UNIQUE globale (T14 smoke).

### Vulnerabilità note (accettate)

- 6 moderate npm audit ereditati da Batch A (postcss < 8.5.10). Re-check
  ad ogni upgrade Next.

### Validazione end-to-end

- ✓ `npm run lint` clean
- ✓ `npm run typecheck` clean (con `noUncheckedIndexedAccess` + `noImplicitReturns`)
- ✓ `npm run build` succeed: 19 routes (8 nuove di Batch C: `/client`,
  `/client/[token]`, `/client/expired`, `/client/projects`,
  `/client/projects/[projectId]`, `/client/files`, `/client/messages`,
  `/client/invoices`, `/workspace/[id]/settings`)
- ✓ RLS smoke test 15/15 (T12 messages path cliente, T13 constraint
  exactly-one violation, T14 invite_token UNIQUE, T15 visibility guard split)
- ✓ Supabase advisor: only `auth_leaked_password_protection` warn (atteso)

### Cose lasciate per Batch D+

- Stripe billing + tier limits (Batch E) — `subscription_tier` hardcoded.
- Recharts dashboard (Batch D).
- Real fatture cliente (Batch D) — placeholder.
- Step-up OTP per azioni sensibili approvazione fatture (Batch D).
- Realtime presence "il freelance sta scrivendo…" (V2, opzionale PRD).
- Upload file da cliente (V2 — il bucket è configurato per owner-only insert).
- Custom domain white-label completo (V2).
- Rate limiting magic link consume (V2 — token UUID v4 è già un guard
  forte; rate limit basta a livello Vercel/Cloudflare).

### Modifiche non-DB a file esistenti

- `src/lib/env.ts`: aggiunti `MAGIC_LINK_JWT_SECRET` (required, min 32
  char) e `RESEND_REPLY_TO` (optional).
- `.env.example`: aggiunte le due var con commento generazione/rotazione.
- `src/proxy.ts`: nessun cambio (pass-through `/client/*` già presente in B).
- `src/components/app/workspace-tabs.tsx`: nuovo prop `messagesUnreadCount`,
  badge stilizzato sulla tab Messaggi.
- `src/components/app/workspace-header.tsx`: bottone "Apri vista cliente"
  → `Link` a `/workspace/[id]/settings#invite` (CTA "Invita cliente").
- `src/actions/messages.ts`: `markMessagesReadAction` filtra
  `not("sender_member_id", "is", null)` per evitare di marcare i propri.
- `src/lib/validation/schemas.ts`: aggiunti schemi Batch C (invite, consume,
  message client, milestone revision/approve/undo, signed URL).
- `package.json`: aggiunta dipendenza `jose`.

### Migrations Batch C

NESSUNA. Le invarianti coperte da SQL già esistenti.

### Tempo speso

- Pianificazione + 4 decisioni con utente: ~10 min
- Lib (env, client-session jose, resend templates+send): ~50 min
- Server Actions (3 file: invites, magic-link, mutations): ~45 min
- UI freelance (settings + invite card + badge unread): ~25 min
- UI cliente (layout + topbar + 8 page + 5 component): ~75 min
- Smoke test extension + advisor + build + lint fixes: ~20 min
- Docs (sprint-log + CLAUDE.md): ~15 min
- **Totale ~4h00m**
