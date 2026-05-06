# CLAUDE.md

Questo file fornisce istruzioni a Claude Code quando lavora su questo repository.

## Cos'è questo progetto

`[NOME_APP]` è un workspace condiviso per freelance italiani e i loro clienti. Sostituisce lo stack improvvisato (WhatsApp + Drive + Excel + gestionale) con un'unica piattaforma che gestisce progetti, file, comunicazione, fatture e pagamenti.

**Documento di riferimento principale:** `docs/PRD.md` — leggilo PRIMA di scrivere qualsiasi codice. Contiene vision, target utenti, feature complete, modello dati, architettura, roadmap.

**Screenshots di riferimento UI:** `docs/screens/` — design generati con Stitch. Usali come riferimento visivo per UI/UX. Lo stile è già definito (vedi sezione "Design system" sotto).

## Stack tecnologico

- **Frontend & Backend:** Next.js 16.2 con App Router, TypeScript strict (Turbopack default)
- **UI:** Tailwind CSS 4 (config CSS-first via `@theme` in `globals.css`, niente `tailwind.config.ts`) + shadcn/ui preset `base-nova` (componenti basati su `@base-ui/react`)
- **Database, Auth, Storage:** Supabase (Postgres + Auth + Storage), istanza in regione EU (London)
- **Pagamenti SaaS:** Stripe (subscription Free/Pro/Studio) — Batch E
- **Email transazionali:** Resend — Batch C in poi
- **Deploy:** Vercel
- **Monitoring:** Sentry + Vercel Analytics — Batch F
- **Validazione:** Zod 4 su tutti i form e Server Actions
- **Form:** react-hook-form 7 + helpers shadcn `Form`
- **Charts:** Recharts — Batch D
- **Routing middleware:** Next 16 ha rinominato `middleware.ts` → `src/proxy.ts` (function `proxy`, non `middleware`).

## Struttura del repository

```
/src
  /app                    # routes Next.js (App Router)
    /(auth)              # gruppo signin/signup (layout senza sidebar)
    /(dashboard)         # gruppo aree autenticate freelance (layout con sidebar)
    /(client)            # gruppo vista cliente via magic link
    /(marketing)         # landing pages e pagine pubbliche
    /api                 # API routes (webhook, cron)
  /components
    /ui                  # componenti shadcn/ui (Button, Card, Dialog, etc.)
    /app                 # componenti applicativi specifici
    /shared              # componenti condivisi tra freelance e cliente
  /lib
    /supabase           # client server e browser
    /stripe             # client e helpers
    /resend             # client e template
    /pyva               # client integrazione Pyva
    /utils              # utility generiche
  /types                # tipi TypeScript condivisi
  /actions              # Server Actions raggruppate per dominio
/supabase
  /migrations           # migrazioni SQL versionate
  /seed.sql            # dati seed (15 template iniziali)
/docs
  PRD.md               # Product Requirements Document
  /screens             # mockup di riferimento (PNG)
```

## Convenzioni di codice

### TypeScript
- `strict: true` sempre. No `any`, no `@ts-ignore` senza commento esplicativo
- Tipi condivisi in `/src/types`, generati da Supabase per il DB schema (`supabase gen types`)
- Usa `type` per oggetti, `interface` solo per estensione

### Naming
- File componenti: `PascalCase.tsx` (es. `ProjectCard.tsx`)
- File utility: `kebab-case.ts` (es. `format-currency.ts`)
- Server Actions: file `actions.ts` per ogni dominio (es. `app/(dashboard)/workspace/actions.ts`)
- Route groups: minuscolo con parentesi per non aggiungere segmenti URL

### Server Actions vs API Routes
- **Server Actions** (default): per tutte le mutazioni invocate dalla UI
- **API Routes** (`/app/api`): solo per webhook esterni (Stripe, Pyva), endpoint chiamati da client esterni, e cron Vercel

### Componenti
- Server Components di default. `'use client'` solo quando necessario (interattività, hooks, browser API)
- Mai mescolare data fetching e UI complessa nello stesso file: separa in `page.tsx` (fetch) + `components/` (UI)
- Tutti gli stati di loading e empty: usa pattern Suspense + `loading.tsx` + `error.tsx`

### Validazione
- Zod schema in file dedicati `_schemas.ts` accanto alle action
- Schema riusati su client (react-hook-form) e server (Server Action)
- Errori di validazione sempre ritornati strutturati, mai eccezioni

## Design system

Riferimento visivo: `docs/screenshots/` (jpeg) e `docs/html_screenshots/` (HTML).
Mapping schermate principali:
- `docs/screenshots/onboarding_step_1_img.jpeg` ↔ `docs/html_screenshots/onboarding.html` — step 1 onboarding
- `docs/screenshots/dashboard_img.jpeg` ↔ `docs/html_screenshots/dashboard.html` — dashboard freelance (Batch B)
- `docs/screenshots/workspace_cliente_img.jpeg` ↔ `docs/html_screenshots/workspace_cliente.html` — vista workspace freelance (Batch B)
- `docs/screenshots/dettaglio_progetto_img.jpeg` ↔ `docs/html_screenshots/dettaglio_progetto.html` — progetto+milestone (Batch B)
- `docs/screenshots/vista_cliente_img.jpeg` ↔ `docs/html_screenshots/vista_cliente.html` — vista cliente (Batch C)
- `docs/screenshots/fatture_img.jpeg` ↔ `docs/html_screenshots/fatture.html` — fatture/cashflow (Batch D)

### Palette colori (Material You — Tailwind 4 via @theme in `src/app/globals.css`)

La fonte di verità è il mockup HTML `docs/html_screenshots/onboarding.html` (decisione Batch A).
I token shadcn/ui (`--primary`, `--card`, `--muted`, ecc.) sono mappati su questa palette.
Token M3 estesi (`--surface-container-*`, `--primary-container`, `--on-secondary-container`, ecc.) sono additivi.

```
background:                   #fdf8fd  (sfondo principale, lavanda chiarissimo)
foreground (on-background):   #1c1b1f
primary:                      #000000  (CTA primarie, brand)
on-primary:                   #ffffff
secondary:                    #5f5c73  (testi secondari)
secondary-container:          #e5dffb  (icone onboarding, badge)
on-secondary-container:       #656279
primary-container:            #1b1345  (icona contenuto, accent scuro)
on-primary-container:         #857db5
surface-container-lowest:     #ffffff  (sfondo card)
surface-container-low:        #f7f2f8  (sidebar)
surface-container:            #f1ecf2  (bottoni muted)
surface-variant:              #e6e1e6  (input chip)
outline:                      #797580
outline-variant:              #c9c5d0  (bordi sottili)
error:                        #ba1a1a
error-container:              #ffdad6
```

### Tipografia

- **Heading H1/H2/H3:** Newsreader (serif), via `next/font/google` → `--font-newsreader`
- **UI/Body:** Inter (sans-serif), via `next/font/google` → `--font-inter`
- **Numerali:** `tabular-nums` di default su `body`; classe utility `.num-tabular` per importi/date.

Type scale (token Tailwind 4 nel `@theme`):
- `text-h1`: 40px / lh 1.2 / -0.02em / weight 500
- `text-h2`: 32px / lh 1.25 / weight 500
- `text-h3`: 24px / lh 1.3 / weight 500
- `text-body-lg`: 18px / lh 1.6 / weight 400
- `text-body-md`: 16px / lh 1.5 / weight 400
- `text-body-sm`: 14px / lh 1.5 / weight 400
- `text-label-caps`: 12px / 0.05em / weight 600 (uppercase chip / kicker)

### Componenti chiave

- **Card:** white background, border-radius 12px (lato freelance) o 16px (lato cliente), shadow molto soft (`shadow-sm` o custom low-opacity)
- **Button primario:** background nero, testo bianco, border-radius 8px, padding generoso
- **Button secondario:** white background, border 1px gray, testo nero
- **Badge/Pill:** uppercase tiny text, padding ridotto, border-radius full (rounded-full)
- **Status indicator:** cerchi che si riempiono progressivamente per milestone (vuoto/mezzo/pieno) — è il pattern visivo distintivo del prodotto
- **Bordo sinistro colorato sulle card** per indicare stato (3px solid, sage/indigo/coral)

### Layout

- Lato freelance: sidebar 240px + main content. Spacing generoso (24-32px tra sezioni)
- Lato cliente: NO sidebar, layout single-column centrato, top bar con nav orizzontale, sfondo più caldo
- Max width contenuto: 1440px desktop

### Tono dei testi

- Italiano nativo, mai tradotto male dall'inglese
- Lato freelance: professionale, conciso ("Nuovo workspace cliente", "Marca come consegnata")
- Lato cliente: caldo, conversazionale ("Ciao Marco, ecco a che punto siamo", "Cosa serve da te")
- MAI: jargon tecnico, anglicismi non necessari, "il tuo dashboard"

## Database e RLS

- Tutte le tabelle hanno RLS abilitato. Mai disabilitarlo.
- Policy RLS sempre testate prima del merge (vedi `scripts/rls-smoke-test.mjs`).
- Migrations versionate in `/supabase/migrations` con timestamp prefix `YYYYMMDDhhmmss_*.sql`.
- Tipi TypeScript del DB rigenerati con `npm run db:types` dopo ogni migration.
- Helper SECURITY DEFINER `private.is_workspace_member(workspace_id, user_id)` e `private.is_workspace_owner(workspace_id, user_id)` usati dalle policy. Lo schema `private` NON è esposto da PostgREST (config `db.schemas = public`), così le funzioni non sono callable via `/rest/v1/rpc/`.
- Trigger `on_auth_user_created` su `auth.users` chiama `private.handle_new_user()` per creare automaticamente il record `profiles` al signup.
- Tipi extension PostgreSQL (es. `citext`, `uuid_generate_v4()`) **devono** essere schema-qualificati come `extensions.citext`, `extensions.uuid_generate_v4()` (convenzione Supabase).

### Database setup

Per ricreare lo schema su un progetto Supabase nuovo:

```powershell
# 1) Login CLI (interattivo, una sola volta)
npx supabase login                           # apre il browser
# oppure non-interactive:
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."

# 2) Link al progetto remoto
npx supabase link --project-ref <project-ref>

# 3) Applica migrations
npx supabase db push

# 4) Applica seed (15 template)
npx supabase db query --linked --file supabase/seed.sql

# 5) Genera tipi TypeScript
$env:SUPABASE_PROJECT_REF = "<project-ref>"
npm run db:types

# 6) Verifica con advisor sicurezza
npx supabase db advisors --linked
# atteso: "No issues found"

# 7) Smoke test RLS
node --env-file=.env.local scripts/rls-smoke-test.mjs
```

## Sicurezza

- Mai loggare dati sensibili (PEC, P.IVA in chiaro, token API)
- Token API esterni (Pyva, Fatture in Cloud) sempre cifrati at-rest con AES-256
- ENCRYPTION_KEY mai committata (env var, generata con `openssl rand -base64 32`)
- File storage: bucket privato, sempre URL signed con expiry max 1 ora
- Magic link cliente: JWT firmato, expiry 90 giorni, single-use opzionale per azioni sensibili

## Workflow di sviluppo

1. Ogni sprint ha un branch dedicato `sprint-N-feature-name`
2. Commit semantici: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
3. Prima di ogni merge: lint, type check, build di produzione devono passare
4. Test E2E con Playwright dallo Sprint 4 in poi
5. Aggiorna questo file `CLAUDE.md` quando vengono prese decisioni architetturali nuove

## Variabili d'ambiente

`.env.local` (NON committare):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
ENCRYPTION_KEY=
PYVA_API_BASE_URL=          # solo dopo Sprint 5
NEXT_PUBLIC_APP_URL=        # http://localhost:3000 in dev, dominio prod in prod
```

`.env.example` (committato, senza valori): template per nuovi dev.

## Note sulle integrazioni

### Pyva
- L'integrazione richiede sviluppi lato Pyva (vedi PRD §5.5)
- Al lancio MVP: implementare con MOCK CLIENT che logga le call e ritorna risposte fake
- L'integrazione vera viene attivata via feature flag dopo allineamento con team Pyva

### Stripe
- Modalità test fino al lancio pubblico
- Webhook locale durante sviluppo: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Crea prodotti/prezzi via Stripe Dashboard, NON da codice (evita drift)

### Resend
- Tutti gli email template in `/src/lib/resend/templates/` come componenti React (react-email)
- Sender unico: `noreply@[dominio-verificato]` per transazionali, `cristian@[dominio]` per outreach manuale

## Cose da NON fare

- Non creare nuove feature non presenti nel PRD senza prima aggiornare il PRD
- Non aggiungere dipendenze npm senza necessità (preferire stdlib o utility minimali)
- Non usare ORM (Prisma, Drizzle): usa il client Supabase direttamente con tipi generati
- Non scrivere codice che bypassi RLS (no SERVICE_ROLE_KEY lato client mai)
- Non hardcodare colori in JSX: sempre via Tailwind con variabili design system
- Non creare componenti generici troppo presto: scrivi inline, estrai quando duplichi 3+ volte
