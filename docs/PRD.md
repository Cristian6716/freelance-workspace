# PRODUCT REQUIREMENTS DOCUMENT

# [NOME_APP]

**Workspace condiviso per freelance italiani**

- **Versione:** 1.0 — Founder PRD
- **Autore:** Cristian Costache
- **Data:** 30 aprile 2026
- **Status:** Draft — pre-development

---

## Indice

1. [Vision & Positioning](#1-vision--positioning)
2. [Target Utenti](#2-target-utenti)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Core Features](#4-core-features)
5. [Architettura Tecnica](#5-architettura-tecnica)
6. [Pricing & Business Model](#6-pricing--business-model)
7. [Go-To-Market](#7-go-to-market)
8. [Roadmap di Esecuzione](#8-roadmap-di-esecuzione)
9. [Rischi e Mitigazioni](#9-rischi-e-mitigazioni)
10. [Appendice: Prompt Pack per Claude Code](#10-appendice-prompt-pack-per-claude-code)
11. [Note finali](#11-note-finali)

---

## 1. Vision & Positioning

### 1.1 Il problema

Il freelance italiano oggi gestisce ogni cliente con uno stack frammentato e improvvisato: WhatsApp per la comunicazione, Drive o WeTransfer per i file, Excel o un foglio mentale per i progetti, un gestionale separato per le fatture, IBAN copia-incollati nelle email per i pagamenti. Il risultato è caos operativo, immagine non professionale verso il cliente, ore perse a recuperare informazioni sparse e ansia ricorrente del cliente che chiede "a che punto siamo?".

I tool americani (HoneyBook, Dubsado, Bonsai) risolvono il problema all'estero ma non sono adattati all'Italia: non integrano la fatturazione elettronica SDI obbligatoria, non parlano il linguaggio del regime forfettario, costano in dollari e propongono workflow estranei alla cultura del lavoro freelance italiano. I gestionali italiani (Fatture in Cloud, Aruba) risolvono solo la fatturazione e non offrono uno spazio condiviso col cliente.

Esiste un vuoto netto: nessun prodotto italiano oggi offre un workspace integrato pensato per come lavora davvero il freelance italiano.

### 1.2 La visione

[NOME_APP] è il workspace condiviso tra il freelance italiano e i suoi clienti. Un unico spazio dove il professionista gestisce progetti, file, comunicazione, fatture e pagamenti, e dove il cliente entra con un link per vedere lo stato del lavoro, approvare consegne e saldare le fatture.

L'obiettivo non è essere il miglior project management tool sul mercato. L'obiettivo è eliminare il caos operativo del freelance e dare al suo cliente un'esperienza professionale, italiana, integrata.

### 1.3 Positioning statement

> Per il freelance italiano che gestisce clienti, [NOME_APP] è lo spazio di lavoro condiviso che sostituisce WhatsApp, Drive, Excel e gestionali separati. A differenza di Notion, HoneyBook o gestionali fiscali, [NOME_APP] è pensato specificamente per il modo italiano di fare freelance: integra la fatturazione SDI, parla il linguaggio della tua professione, ed è progettato per essere mostrato al cliente.

### 1.4 Principi di prodotto

Cinque principi guidano ogni decisione di prodotto. Quando una scelta è dubbia, si torna a questi principi.

1. **Il cliente del freelance è l'utente più importante.** L'app deve essere bella per chi entra come ospite, non solo per chi paga. È il biglietto da visita digitale del freelance.
2. **Lightweight per default.** Ogni feature deve avere uno stato "vuoto" elegante e funzionare da subito senza configurazione. Nessun setup obbligatorio prima di vedere valore.
3. **Italiano nativo.** Non tradotto, italiano. Linguaggio, normative, abitudini, calendari fiscali, festività.
4. **Verticali nel marketing, orizzontale nel codice.** Una sola app, cinque landing pages, cinque persona.
5. **Bring-your-own quando possibile.** L'utente collega gli strumenti che già usa (gestionale fatture, Stripe, Google Drive). Non lo costringiamo a migrare.

---

## 2. Target Utenti

### 2.1 Strategia: orizzontale nel codice, verticale nel marketing

L'app è una sola, con un layer di personalizzazione per professione. Le 5 verticali al lancio condividono lo stesso codebase, lo stesso database, le stesse feature core. Ogni verticale ha:

- Una landing page dedicata con linguaggio, screenshot e case study della professione
- Template di progetto preconfigurati specifici
- Glossario UI adattato (un architetto vede "fasi", un dev vede "sprint", un fotografo vede "shooting")
- Onboarding personalizzato che precompila il workspace iniziale
- Campagne ads e SEO mirate

### 2.2 Le 5 verticali al lancio

#### Verticale 1 — Sviluppatori e designer web

*Stima TAM Italia: 80.000-120.000 freelance attivi*

**Persona:** Marco, 32 anni, Milano. Web developer freelance forfettario. Lavora su 3-5 progetti contemporaneamente, ognuno con 2-4 milestone (mockup, sviluppo, contenuti, deploy). Tipico cliente: PMI o agenzia. Range fatture: 1.500-8.000 €. Comunicazione cliente via WhatsApp e email. Usa Notion personale per tracciare i progetti, ma il cliente non lo vede.

**Pain points specifici:** il cliente chiede aggiornamenti continui via WhatsApp; mockup persi nelle chat; richieste di modifiche fuori scope difficili da tracciare e fatturare.

#### Verticale 2 — Architetti, geometri, ingegneri

*Stima TAM Italia: 150.000-200.000 professionisti tra liberi professionisti e studi piccoli*

**Persona:** Laura, 38 anni, Bologna. Architetto con studio di una persona. Lavora su 8-15 progetti contemporaneamente in fasi diverse (preliminare, definitivo, esecutivo, direzione lavori). File pesanti (DWG, render, PDF). Cliente privato e pubblico. Range parcelle: 3.000-25.000 €. Pratiche burocratiche con SAL (stati avanzamento lavori).

**Pain points specifici:** file CAD enormi via WeTransfer scaduti; SAL e fatture acconto da tracciare; cliente che chiama per chiedere lo stato pratica; coordinare con altri professionisti (geologo, impiantista).

#### Verticale 3 — Fotografi e videomaker

*Stima TAM Italia: 40.000-60.000 professionisti attivi*

**Persona:** Davide, 29 anni, Roma. Fotografo wedding e lifestyle. Workflow ripetitivo: preventivo → caparra → shooting → post-produzione → consegna gallery. Range fatture: 800-3.500 €. Cliente emotivo (sposa, famiglia) che vuole rassicurazione costante.

**Pain points specifici:** gallery foto inviate via Pixieset/WeTransfer separate dal resto; selezione foto via email caotica; caparra e saldo da tracciare; contratti firmati via PDF che si perdono.

#### Verticale 4 — Commercialisti e consulenti fiscali

*Stima TAM Italia: 70.000-90.000 commercialisti + 30.000+ consulenti fiscali junior*

**Persona:** Giulia, 41 anni, Napoli. Commercialista con 80-150 clienti ricorrenti. Tipico cliente forfettario o piccola SRL. Servizi continuativi (contabilità mensile, dichiarazioni annuali, consulenze spot). Range parcelle: 50-300 €/mese ricorrente per cliente, più consulenze singole.

**Pain points specifici:** client portal ricorrente, non a progetto; raccolta documenti mensile dai clienti ("mandami le fatture del mese"); scadenze fiscali da comunicare ai clienti; risposte alle stesse domande ripetute dieci volte al mese.

#### Verticale 5 — Social media manager e marketer freelance

*Stima TAM Italia: 50.000-80.000 freelance attivi*

**Persona:** Sara, 27 anni, Torino. SMM freelance. Gestisce 4-7 clienti in retainer mensile. Servizi: piano editoriale, content creation, ads management, reporting mensile. Range: 400-1.500 €/mese per cliente.

**Pain points specifici:** approvazione contenuti via WhatsApp infinita; report mensili scritti a mano in Google Docs; cliente che paga in ritardo; rinnovi contrattuali da gestire.

### 2.3 TAM totale aggregato

Sommando le 5 verticali al lancio si stima un mercato indirizzabile di **390.000-550.000 freelance professionali italiani**. A pricing target di 19-39 €/mese, anche una penetrazione dello 0,5% genera 1.950-2.750 utenti paganti, ossia 37.000-70.000 € MRR potenziale al primo anno se l'esecuzione di marketing è efficace.

---

## 3. Competitive Landscape

### 3.1 Tabella competitor

La tabella confronta [NOME_APP] con i principali concorrenti diretti e indiretti.

| Strumento | Origine | Forza principale | Debolezza vs noi |
|---|---|---|---|
| HoneyBook / Dubsado | USA | Workflow client portal completi | Zero SDI, no italiano, dollari |
| Bonsai | USA | All-in-one per freelance | No SDI, no forfettario |
| Fatture in Cloud / Aruba | IT | Fatturazione SDI consolidata | No client portal, no PM |
| Notion + Tally + Stripe | Mix | Flessibilità totale | Setup manuale, no SDI |
| TeamWork / ClickUp / Asana | USA | Project management profondo | Overkill per freelance, no client-facing |
| WhatsApp + Drive + Excel | — | Zero costo, zero attrito | Caos, no professionalità |

### 3.2 Posizionamento

[NOME_APP] non compete con i gestionali fiscali (li integra), non compete con i PM tool (è più leggero), non compete con i tool USA (è italiano nativo). Compete con il caos: lo stack improvvisato di WhatsApp + Drive + Excel + gestionale che la maggioranza dei freelance italiani usa oggi.

Il vero benchmark di prodotto è HoneyBook (USA, fondato 2013, 100M+ ARR stimato), che ha costruito un gigantesco mercato facendo esattamente questo workflow per i freelance USA. La tesi è che lo stesso pattern, adattato all'Italia con SDI e linguaggio nativo, ha un mercato significativo.

---

## 4. Core Features

Questa sezione descrive le feature divise per release. L'MVP è dimensionato per essere costruibile in 8-12 settimane con 1-2 dev usando Claude Code. V2 e V3 sono iterazioni successive guidate da feedback utente.

### 4.1 MVP — Release 1.0

Scope: l'app deve essere usabile end-to-end da un freelance con un cliente e una fattura. Tutto il resto viene dopo.

#### 4.1.1 Auth e onboarding

- Sign-up con email/password e Google OAuth
- Onboarding 3 step: 1) scelta verticale (5 opzioni), 2) dati profilo professionale (nome, P.IVA, regime fiscale), 3) primo workspace cliente da creare o saltare
- In base al verticale scelto, il sistema precarica template di progetto specifici
- Profilo utente con: dati anagrafici, P.IVA, regime fiscale, IBAN, logo, colori brand

#### 4.1.2 Workspace cliente

L'unità centrale dell'app. Un workspace = un cliente. Contiene tutti i progetti, file, comunicazioni e fatture relativi a quel cliente.

- Creazione workspace con: nome cliente, contatti, tipo cliente (privato/azienda/PA), dati fatturazione (P.IVA, codice destinatario SDI o PEC, indirizzo)
- Invito cliente via email con link magico (no password obbligatoria, accesso via magic link inizialmente)
- Vista cliente personalizzata con logo e colori del freelance (white-label leggero)
- Dashboard cliente con: progetti attivi, file recenti, fatture, messaggi

#### 4.1.3 Progetti

Due tipologie di progetto, scelte in fase di creazione:

- **Progetto a consegne**: ha data inizio, data fine prevista, milestone (3-10 tipiche). Ogni milestone ha titolo, descrizione, stato (da fare / in corso / consegnata / approvata), data prevista, importo opzionale.
- **Servizio ricorrente**: rapporto continuativo senza fine definita. Ha periodicità (mensile/trimestrale), importo ricorrente, eventuali deliverable mensili (es. report SMM, contabilità).
- Stato progetto visibile sia al freelance sia al cliente
- Note interne (visibili solo al freelance) vs note pubbliche (visibili al cliente)
- Approvazione milestone con un click da parte del cliente

#### 4.1.4 File e documenti

- Upload file fino a 100MB per file (limite tecnico iniziale, ampliabile)
- Storage Supabase Storage con quote per piano: Free 500MB, Pro 20GB, Studio 100GB
- Organizzazione file per progetto, con cartelle opzionali
- Anteprima inline per immagini, PDF, documenti Office
- Visibilità file: privato (solo freelance) o condiviso (visibile al cliente)
- Versioning leggero: ogni nuovo upload con stesso nome crea v2, v3, ecc.

#### 4.1.5 Comunicazione

- Chat per workspace: stream cronologico di messaggi tra freelance e cliente
- Possibilità di taggare un messaggio a un progetto o milestone specifico
- Notifiche email al destinatario per ogni nuovo messaggio (con opzione di disattivarle)
- Allegati nei messaggi (link a file già nel workspace o upload diretto)

#### 4.1.6 Fatturazione (bring-your-own + integrazione Pyva)

Strategia di lancio: l'app non emette direttamente fatture SDI. L'utente ha tre opzioni progressive:

- **Manuale (free e Pro):** l'utente carica una fattura PDF già emessa altrove e la marca come "emessa". Il sistema traccia stato (emessa, pagata, scaduta) ma non emette nulla via SDI.
- **Integrazione Pyva (Pro+):** l'utente collega il proprio account Pyva via OAuth o API key. [NOME_APP] genera la bozza fattura precompilata dal progetto/milestone, l'utente la finalizza in Pyva con un click. La fattura emessa torna in [NOME_APP] con stato e XML scaricabile.
- **Integrazione Fatture in Cloud (Pro+, fase 2):** stessa logica per chi non usa Pyva, via API ufficiali Fatture in Cloud.
- Stato fattura visibile al cliente con bottone "Scarica PDF" e "Paga ora"
- Reminder automatici al cliente: 3 giorni prima della scadenza, il giorno della scadenza, 7 e 14 giorni dopo

#### 4.1.7 Pagamenti (zero intermediazione)

L'app non tocca mai i soldi. Il freelance configura le sue modalità di incasso e l'app le mostra al cliente.

- Configurazione metodi di pagamento da parte del freelance: IBAN per bonifico, link Stripe Checkout proprio, link PayPal.me
- Generazione automatica della causale bonifico standard ("Fattura n.X del DD/MM/YYYY")
- Tracking manuale dello stato pagamento: il freelance marca la fattura come "pagata" quando riceve il bonifico
- Tracking automatico per Stripe: webhook che marca la fattura come pagata quando lo Stripe Checkout linkato si conclude
- Dashboard cash flow: incassato nel mese, in attesa, scaduto

#### 4.1.8 Templates per verticale

Al primo accesso ogni utente vede template di progetto preconfigurati per la sua verticale. Esempi:

- Web dev: "Sito vetrina 5 pagine", "E-commerce Shopify", "App mobile MVP"
- Architetto: "Ristrutturazione residenziale", "Pratica edilizia", "Direzione lavori"
- Fotografo: "Wedding", "Servizio brand", "Shooting prodotto"
- Commercialista: "Contabilità ordinaria mensile", "Dichiarazione redditi forfettario"
- SMM: "Gestione social mensile", "Campagna ads spot", "Lancio prodotto 30 giorni"

### 4.2 V2 — Release 1.5 (mese 4-6)

Aggiunte guidate dal feedback dei primi 100-200 utenti.

- E-signature integrata per contratti e preventivi
- Preventivi formali (separati dalle fatture) con accettazione cliente
- Modulo "raccolta documenti" per commercialisti (cliente uploada documenti del mese)
- Approvazione bozze contenuti per SMM (calendario editoriale con approvazione client-side)
- App mobile companion per il cliente (Expo, solo lettura + approvazioni)
- Integrazione Google Calendar e Apple Calendar per scadenze
- Time tracking opzionale per progetti a ore

### 4.3 V3 — Release 2.0 (mese 7-12)

- Marketplace template community-driven
- Studio tier multi-utente con gestione team
- API pubbliche e webhook per integrazioni custom
- AI assistant integrato (riepiloghi, bozze risposte, generazione preventivi da brief)
- Analytics avanzate: redditività per cliente, ore per progetto, margine
- Espansione verticali: avvocati, traduttori, coach, PT, copywriter

---

## 5. Architettura Tecnica

### 5.1 Stack tecnologico

| Layer | Tecnologia | Motivazione |
|---|---|---|
| Frontend | Next.js 15 + App Router + TypeScript | Stack già padroneggiato dal founder, SSR per SEO landing pages |
| UI | Tailwind CSS + shadcn/ui | Design system veloce, componenti accessibili, customizable |
| Backend | Next.js API routes + Server Actions | Monorepo semplice, niente backend separato per MVP |
| Database | Supabase (Postgres) | Auth, DB, Storage, Realtime in un solo provider |
| Auth | Supabase Auth | Email/password, magic link, OAuth Google |
| Storage file | Supabase Storage | Bucket privati con RLS |
| Pagamenti SaaS | Stripe (subscription) | Standard de facto |
| Email transazionali | Resend | API moderna, ottimo deliverability |
| Deployment | Vercel | CI/CD automatico, edge functions |
| Monitoring | Sentry + Vercel Analytics | Error tracking + performance |
| Mobile (V2) | Expo + React Native | Stesso ecosistema, riuso TypeScript |

### 5.2 Modello dati

Schema relazionale Postgres. Le entità seguenti vengono create come tabelle Supabase con RLS abilitato. Tutti i timestamp sono UTC.

#### Entità principali

```sql
-- Utente freelance (proprietario account)
profiles
  id uuid PK (FK auth.users)
  email text
  full_name text
  vertical text  -- 'web_dev' | 'architect' | 'photographer' | 'accountant' | 'smm'
  vat_number text  -- partita IVA
  fiscal_regime text  -- 'forfettario' | 'ordinario'
  iban text
  logo_url text
  brand_color text
  pyva_connected boolean
  pyva_api_key_encrypted text
  fatture_in_cloud_token_encrypted text
  subscription_tier text  -- 'free' | 'pro' | 'studio'
  subscription_status text
  stripe_customer_id text
  created_at timestamptz
  updated_at timestamptz
```

```sql
-- Workspace cliente (uno per ogni cliente del freelance)
client_workspaces
  id uuid PK
  owner_id uuid FK profiles
  client_name text
  client_type text  -- 'private' | 'company' | 'pa'
  client_email text
  client_phone text
  client_vat text
  client_sdi_code text  -- codice destinatario SDI o PEC
  client_address jsonb
  status text  -- 'active' | 'archived'
  created_at timestamptz
```

```sql
-- Membri del workspace (cliente invitato + freelance)
workspace_members
  id uuid PK
  workspace_id uuid FK client_workspaces
  user_id uuid FK profiles (nullable - per ospiti via magic link)
  email text
  role text  -- 'owner' | 'client'
  invite_token text
  invited_at timestamptz
  accepted_at timestamptz
```

```sql
-- Progetti dentro un workspace
projects
  id uuid PK
  workspace_id uuid FK client_workspaces
  title text
  description text
  type text  -- 'deliverable' | 'recurring'
  status text  -- 'draft' | 'active' | 'completed' | 'archived'
  start_date date
  end_date date
  recurring_period text  -- 'monthly' | 'quarterly' (solo se type=recurring)
  recurring_amount numeric(10,2)
  total_amount numeric(10,2)
  template_id uuid FK templates (nullable)
  created_at timestamptz
```

```sql
-- Milestone all'interno di un progetto
milestones
  id uuid PK
  project_id uuid FK projects
  title text
  description text
  status text  -- 'todo' | 'in_progress' | 'delivered' | 'approved'
  due_date date
  amount numeric(10,2)
  order_index integer
  completed_at timestamptz
  approved_at timestamptz
```

```sql
-- File condivisi nel workspace
files
  id uuid PK
  workspace_id uuid FK client_workspaces
  project_id uuid FK projects (nullable)
  uploaded_by uuid FK profiles
  filename text
  storage_path text
  size_bytes bigint
  mime_type text
  visibility text  -- 'private' | 'shared'
  version integer
  created_at timestamptz
```

```sql
-- Messaggi nel workspace
messages
  id uuid PK
  workspace_id uuid FK client_workspaces
  project_id uuid FK projects (nullable)
  milestone_id uuid FK milestones (nullable)
  sender_id uuid FK profiles
  body text
  attachments jsonb  -- array di file_id
  created_at timestamptz
  read_at timestamptz
```

```sql
-- Fatture (tracking, non emissione diretta)
invoices
  id uuid PK
  workspace_id uuid FK client_workspaces
  project_id uuid FK projects (nullable)
  milestone_id uuid FK milestones (nullable)
  invoice_number text
  issue_date date
  due_date date
  amount numeric(10,2)
  status text  -- 'draft' | 'issued' | 'paid' | 'overdue'
  source text  -- 'manual_pdf' | 'pyva' | 'fatture_in_cloud'
  external_id text  -- ID nel sistema esterno
  pdf_url text
  xml_url text
  payment_method text  -- 'bank' | 'stripe' | 'paypal'
  payment_link text
  paid_at timestamptz
  created_at timestamptz
```

```sql
-- Template di progetto per verticale
templates
  id uuid PK
  vertical text  -- 'web_dev' | 'architect' | etc.
  name text
  description text
  default_milestones jsonb  -- array di {title, description, default_amount_pct}
  is_official boolean
  created_by uuid FK profiles (nullable)
```

### 5.3 Row-Level Security (RLS)

Tutte le tabelle hanno RLS attivo. Le policy chiave:

- `profiles`: l'utente legge/scrive solo il proprio profilo
- `client_workspaces`: il freelance vede solo i workspace di cui è owner
- `workspace_members`: visibili solo a chi è membro del workspace
- `projects`, `milestones`, `files`, `messages`, `invoices`: accessibili solo ai membri del workspace, con filtro su visibility per i file privati (visibili solo all'owner)
- Per gli ospiti via magic link, l'accesso usa un token in JWT custom che identifica il workspace_member specifico

### 5.4 Architettura macro

```
[Browser freelance]            [Browser cliente]
       |                              |
       v                              v
   Next.js App (Vercel) — App Router + Server Actions
       |
       +--- Supabase Auth (sessions)
       +--- Supabase DB (Postgres + RLS)
       +--- Supabase Storage (file)
       +--- Stripe API (subscription SaaS)
       +--- Resend API (email transazionali)
       +--- Pyva API (fatturazione, integrazione)
       +--- Fatture in Cloud API (alternativa Pyva)

   Webhook handlers:
       +--- Stripe webhook (subscription events)
       +--- Pyva webhook (fattura emessa, pagata, scartata)
```

### 5.5 Integrazione Pyva

Pyva oggi gestisce: creazione bozze, generazione XML SDI, invio via PEC, polling notifiche SDI (RC, NS, MC), modifica bozze, download XML, configurazione PEC cifrata. L'integrazione [NOME_APP] ↔ Pyva sfrutta queste capacità così:

1. L'utente connette Pyva da Impostazioni di [NOME_APP] tramite OAuth (da implementare lato Pyva) o tramite API key incollata
2. Quando una milestone è approvata o un servizio ricorrente raggiunge la data di fatturazione, [NOME_APP] chiama API Pyva `/api/invoices` con i dati pre-compilati: cliente (anagrafica completa, codice destinatario), importo, descrizione, regime fiscale dell'utente
3. Pyva crea la bozza fattura. Risposta: invoice_id Pyva, link a bozza
4. [NOME_APP] mostra al freelance un bottone "Rivedi e invia in Pyva" che apre Pyva in nuova tab
5. Il freelance finalizza in Pyva (controlla, invia via PEC al SDI). Pyva fa l'invio.
6. Pyva chiama webhook [NOME_APP] `/api/webhooks/pyva` quando: bozza emessa, notifica SDI ricevuta (RC = consegnata, NS = scartata, MC = mancata consegna), pagamento registrato
7. [NOME_APP] aggiorna lo stato fattura nel proprio DB e notifica freelance e cliente

Lato Pyva sarà necessario aggiungere (è scope side, ma il PRD lo segnala):

- Endpoint OAuth o sistema di API key per integrazioni esterne
- Endpoint POST `/api/invoices` con creazione bozza programmatica
- Sistema di webhook outgoing su eventi fattura
- Possibilità di passare `external_reference` per tracciare il legame con la milestone [NOME_APP]

### 5.6 Sicurezza e privacy

- Hosting EU (Vercel + Supabase EU region) per compliance GDPR
- Cifratura at-rest dei token API esterni (Pyva, Fatture in Cloud) con AES-256
- PEC e dati fiscali sensibili mai loggati in chiaro
- Magic link expiry 24 ore, single-use
- File storage con URL signed expiring (max 1 ora)
- Audit log per azioni sensibili (cambio piano, eliminazione workspace, modifica fatture)
- Backup automatici Supabase ogni 24 ore, retention 30 giorni
- DPA con Supabase, Vercel, Stripe, Resend già conformi GDPR

---

## 6. Pricing & Business Model

### 6.1 Tiers

| Piano | Prezzo | Limiti chiave | Audience |
|---|---|---|---|
| Free | 0 €/mese | 1 workspace cliente, 500MB storage, branding [NOME_APP] visibile | Trial / curiosi / freelance occasionali |
| Pro | 19 €/mese (15 €/mese annuale) | Workspace illimitati, 20GB storage, no branding, integrazione Pyva | Freelance attivi single-tenant |
| Studio | 39 €/mese (32 €/mese annuale) | Tutto Pro + multi-utente fino a 3 collaboratori, 100GB, white-label completo, SLA prioritaria | Mini-studi, freelance con assistente |

### 6.2 Modello di revenue

- Subscription mensile o annuale (annuale -20%)
- Trial 14 giorni del piano Pro senza richiesta carta
- Nessuna fee transazionale sui pagamenti del cliente al freelance (zero intermediazione)
- Nessuna fee sulle fatture emesse

### 6.3 Proiezioni first year (scenario base)

Ipotesi: TAM 5 verticali ~450k freelance. Penetrazione conservativa 0.1% in 12 mesi = 450 utenti paganti. Mix tier: 70% Pro (315 utenti × 19 €) + 25% Studio (113 × 39 €) + 5% trial/free non monetizzato.

| Mese | Utenti free cumulati | Utenti paganti | MRR (€) |
|---|---|---|---|
| 3 | 200 | 30 | 650 |
| 6 | 800 | 120 | 2.700 |
| 9 | 1.800 | 260 | 5.900 |
| 12 | 3.500 | 450 | 10.300 |

*Scenario aggressivo (penetrazione 0.3% al mese 12): MRR ~30.000 €. Scenario pessimistico (0.05%): MRR ~5.000 €. La leva principale è acquisizione: ads + SEO + community building.*

### 6.4 Eventuale bundle Pyva

In futuro è possibile creare un bundle congiunto:

- Pyva + [NOME_APP] Pro: 29 €/mese invece di 19 + costo Pyva (sconto attrattivo per chi ha entrambi)
- Pyva + [NOME_APP] Studio: 49 €/mese
- Cross-sell automatico: utente Pyva vede in dashboard "prova [NOME_APP] gratis" e viceversa

*Questa decisione viene rinviata post-MVP, una volta capita la elasticità del pricing.*

---

## 7. Go-To-Market

### 7.1 Strategia: 5 funnel paralleli

Una landing page e una campagna ads per ognuna delle 5 verticali. Ogni funnel è autonomo, ottimizzabile separatamente, con messaggi e creativi specifici.

### 7.2 Pre-launch (mese -1, durante sviluppo MVP)

- Landing page "coming soon" con 5 sotto-pagine verticali
- Lead magnet per ogni verticale (es. template Notion gratuito "Workspace cliente per architetti")
- Build in public su LinkedIn IT e X: thread settimanali sul progresso, learnings, sneak peek
- Outreach manuale a 50 freelance per verticale (250 totali) per beta closed
- Obiettivo: 500-1000 email in waitlist prima del lancio

### 7.3 Lancio (mese 0)

- Soft launch alla waitlist con offerta lifetime/early bird (es. -50% per i primi 100)
- Product Hunt launch (versione inglese della landing)
- AppSumo deal opzionale (lifetime deal a 49-99 € per validare e cash flow)
- PR a testate IT (Ninja Marketing, StartupItalia, Repubblica Tech)

### 7.4 Post-lancio (mese 1-6)

#### Acquisizione paid

- Meta Ads (Facebook + Instagram): 5 campagne separate per verticale, budget iniziale 30 €/giorno per campagna = 150 €/giorno totali
- Google Ads: keywords specifiche per verticale (es. "gestionale freelance forfettario", "client portal architetto")
- LinkedIn Ads per le verticali B2B (commercialisti, dev senior)
- Target CPA: 30-50 € per signup paid, LTV target 250+ € (12 mesi × 19 € meno churn)

#### Acquisizione organica

- SEO content marketing: 2 articoli/settimana, focus keyword come "come gestire clienti freelance", "fatturazione elettronica freelance", "client portal italiano"
- YouTube: tutorial verticali ("come gestire un progetto da architetto con [NOME_APP]")
- LinkedIn personal brand del founder: build in public, MRR pubblico, learnings
- Community: presenza in gruppi Facebook/Telegram di ogni verticale, no spam, vero valore
- Programma referral: 1 mese gratis per chi invita un amico che paga

#### Partnership

- Commercialisti: programma affiliazione 30% recurring per chi raccomanda ai propri clienti freelance
- Ordini professionali (Architetti, Fotografi): sponsorship eventi e content
- Influencer di nicchia: micro-influencer su Instagram per fotografi, su LinkedIn per dev

### 7.5 Metriche di successo GTM

| Metrica | Target M3 | Target M6 | Target M12 |
|---|---|---|---|
| Visite uniche/mese | 5.000 | 20.000 | 60.000 |
| Signup totali | 300 | 1.200 | 4.000 |
| Conversion signup → paid | 15% | 20% | 25% |
| MRR (€) | 650 | 2.700 | 10.300 |
| Churn mensile | <8% | <6% | <5% |
| NPS | 30+ | 40+ | 50+ |

---

## 8. Roadmap di Esecuzione

### 8.1 Sprint plan MVP (12 settimane)

Schema settimanale assumendo 1 dev full-time + 1-2 co-founder part-time per design/marketing. Ogni sprint produce un incremento testabile.

#### Sprint 0 (settimana 1) — Setup

- Repo monorepo Next.js, configurazione Vercel, Supabase project EU
- Schema DB iniziale (profiles, workspaces, members), RLS base
- Auth signup/signin email + Google
- Design system con shadcn/ui, palette, tipografia, primi componenti
- Setup CI/CD, Sentry, env management

#### Sprint 1 (settimana 2-3) — Workspace e onboarding

- Onboarding 3-step con scelta verticale
- Creazione workspace cliente (form anagrafica completa)
- Invito cliente via magic link
- Vista cliente (logged-in via magic link)
- Profilo utente completo (P.IVA, IBAN, logo upload)

#### Sprint 2 (settimana 4-5) — Progetti e milestone

- CRUD progetti tipo deliverable e recurring
- CRUD milestone con stati e ordering
- Approvazione milestone client-side
- Templates verticali (5 verticali × 3 template = 15 totali)
- Vista progetto cliente con stato visivo

#### Sprint 3 (settimana 6) — File e messaggi

- Upload file Supabase Storage con visibility privato/condiviso
- Anteprima inline immagini, PDF
- Versioning leggero
- Chat workspace con notifiche email via Resend

#### Sprint 4 (settimana 7-8) — Fatturazione tracking

- CRUD fatture manuali (upload PDF, dati)
- Stati fattura e calcolo overdue
- Reminder email automatici via cron Vercel
- Dashboard cash flow

#### Sprint 5 (settimana 9-10) — Integrazione Pyva

- Connessione account Pyva (API key flow inizialmente)
- Generazione bozza fattura da milestone via API Pyva
- Webhook handler eventi Pyva (emessa, SDI status, pagata)
- Sync stato fattura bidirezionale
- Lavoro lato Pyva: aggiunta endpoint API, webhook outgoing

#### Sprint 6 (settimana 11) — Pagamenti e billing SaaS

- Configurazione metodi pagamento freelance (IBAN, Stripe Connect/Checkout, PayPal.me)
- Stripe subscription per [NOME_APP] stesso (Free/Pro/Studio)
- Webhook Stripe per gestione lifecycle subscription
- Billing portal e gestione piano

#### Sprint 7 (settimana 12) — Polish, beta, lancio

- QA completo end-to-end di tutti i flussi
- Landing pages 5 verticali su sotto-percorsi
- Onboarding tour interattivo
- Email transazionali polish (template branded)
- Apertura beta a 50 utenti waitlist
- Setup analytics, conversion tracking ads

### 8.2 Milestone post-MVP

| Milestone | Quando | Definizione di successo |
|---|---|---|
| Soft launch | Settimana 13 | 50 beta tester attivi, 10+ feedback strutturati |
| Public launch | Settimana 16 | Product Hunt + waitlist activation, 300+ signup |
| First 100 paid | Mese 4-5 | Validazione pricing, mix tier osservato |
| V1.5 release | Mese 6 | Feature gap colmate da feedback (e-signature, preventivi, mobile companion) |
| Break-even infra | Mese 6-8 | MRR > costi tecnici (~500 €/mese) |
| First $10k MRR | Mese 12-15 | Validazione di scalabilità modello |

---

## 9. Rischi e Mitigazioni

### 9.1 Rischi di prodotto

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Prodotto troppo orizzontale, nessuna verticale lo sceglie | Media | Alto | Marketing iper-verticale, landing dedicate, template specifici, onboarding personalizzato |
| Cliente del freelance non usa il portale | Media | Alto | UX semplificata cliente-side, magic link senza password, notifiche email per pull dentro il portale |
| Migrazione da WhatsApp difficile (inerzia) | Alta | Medio | Onboarding che minimizza friction, import lista clienti CSV, no abbandono WhatsApp ma riduzione progressiva |
| Feature creep, sviluppo MVP > 12 settimane | Alta | Alto | Scope MVP rigoroso, tutto ciò che non è in sezione 4.1 va in V2 |

### 9.2 Rischi tecnici

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Integrazione Pyva ritarda perché Pyva richiede sviluppi | Alta | Medio | Lancio MVP con sola fatturazione manuale, integrazione Pyva in sprint dedicato |
| Performance Supabase con molti workspace | Bassa | Medio | Indici corretti, paginazione, monitoring; piano upgrade Supabase se necessario |
| File storage costi crescono | Media | Medio | Quota per piano, CDN caching, compression immagini lato client |
| Sicurezza dati fiscali sensibili | Media | Alto | Cifratura at-rest, audit log, penetration test prima del lancio pubblico |

### 9.3 Rischi di mercato

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| HoneyBook o simile entra in Italia | Bassa | Alto | Vantaggio incumbent locale, integrazione SDI, lingua e supporto, brand italiano |
| Fatture in Cloud lancia client portal | Media | Alto | Differenziazione su PM, UX cliente, multi-vertical; partnership invece di concorrenza |
| Forfettario abolito o cambiato (suggerimento FMI) | Bassa | Medio | Prodotto utile anche per regime ordinario, posizionamento neutro al regime |
| CAC > LTV (ads non sostenibile) | Media | Alto | Mix paid/organico, focus content marketing, referral program, retention obsessiva |

---

## 10. Appendice: Batch di Esecuzione per Claude Code

Questa sezione contiene i 6 batch operativi per costruire l'MVP usando Claude Code. Ogni batch è autosufficiente, contiene un obiettivo unitario e termina con una checklist di validazione end-to-end. I batch sono dimensionati per essere eseguiti in una singola sessione lunga di Claude Code, con verifica funzionale prima di passare al successivo.

### Strategia di esecuzione

**Perché batch e non prompt singoli.** Raggruppare lavori che condividono modello dati, pattern UI e file toccati riduce overhead di context-switching, evita codice incoerente tra task separati e mantiene focus.

**Perché non un singolo mega-prompt.** Errori di schema o RLS si propagano e diventano costosi da correggere se scoperti tardi. La validazione intermedia tra batch è il meccanismo che protegge la qualità del codice e il controllo del founder sul prodotto.

**Stack di riferimento per tutti i batch.** Next.js 16.2+ con App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + Storage in regione EU), Stripe, Resend. Turbopack è default. Documentazione di riferimento sempre: `CLAUDE.md` (convenzioni) e `docs/PRD.md` (spec funzionali).

**File di riferimento visivo.** Ogni batch richiama gli screenshot pertinenti in `docs/screens/`. Claude Code può leggerli e usarli come riferimento UI/UX.

### Ordine dei batch e tempistiche stimate

| Batch | Sprint PRD | Contenuto | Tempo Claude | Verifica founder |
|---|---|---|---|---|
| A | 0 + 1 | Fondamenta: setup, schema DB, auth, onboarding | 2-4 ore | 1-2 ore |
| B | 2 + 3 | Workspace core: progetti, milestone, file, messaggi | 3-5 ore | 2-3 ore |
| C | (parte di 1) | Vista cliente via magic link | 2-3 ore | 1-2 ore |
| D | 4 + 5 | Fatturazione: tracking manuale + integrazione Pyva | 3-4 ore | 2-3 ore |
| E | 6 | Subscription Stripe e billing SaaS | 2-3 ore | 1-2 ore |
| F | 7 | Polish: email, observability, landing pages | 3-4 ore | 2-3 ore |

I tempi Claude sono indicativi (dipendono dalla velocità e dal modello). I tempi di verifica founder sono altrettanto importanti e includono test end-to-end, lettura del codice generato, fix di edge case.

---

### BATCH A — Fondamenta

**Obiettivo:** repo Next.js 16.2 funzionante con auth completo, schema DB completo con RLS, onboarding 3-step. Al termine, un nuovo utente può registrarsi, completare l'onboarding scegliendo verticale e creare il primo workspace cliente.

**Prerequisiti:**
- Repo GitHub creato e clonato in locale
- File `CLAUDE.md` alla root e `docs/PRD.md` presenti
- Account Supabase creato (regione EU), `.env.local` con `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`
- Node.js 20+ installato

**Prompt da incollare in Claude Code:**

```
Leggi prima CLAUDE.md alla root e docs/PRD.md per il contesto completo del progetto.
Riferimenti UI: docs/screens/06-onboarding-step1.png

OBIETTIVO BATCH A: implementa fondamenta complete del progetto.

==== PARTE 1: SETUP PROGETTO ====

1. Inizializza Next.js 16.2+ con TypeScript, Tailwind, App Router, src-dir, alias @/*. Verifica versione >= 16.2.

2. Configura tailwind.config.ts con la palette del design system definita in CLAUDE.md (background #F5F3F7, accent-indigo #3D2F5F, accent-sage #7B9E89, accent-coral #D88775, accent-cream #FAF7F2, etc.).

3. Configura font Instrument Serif (heading) e Inter (body) via next/font/google.

4. Installa shadcn/ui (npx shadcn@latest init) con la palette custom. Aggiungi componenti base che servono per questo batch: button, input, label, card, dialog, select, form, sonner (toast), avatar, badge.

5. Installa dipendenze:
   - @supabase/supabase-js, @supabase/ssr
   - zod, react-hook-form, @hookform/resolvers
   - lucide-react, date-fns
   - resend (lo useremo dopo per email magic link)

6. Crea la struttura completa /src/app, /src/components/ui, /src/components/app, /src/components/shared, /src/lib/supabase, /src/lib/utils, /src/types, /src/actions, /supabase/migrations.

7. Crea client Supabase:
   - src/lib/supabase/server.ts (createServerClient)
   - src/lib/supabase/client.ts (createBrowserClient)
   - src/lib/supabase/middleware.ts (helper refresh sessione)

8. Crea src/middleware.ts: refresh sessione su ogni request, protezione /(dashboard)/* con redirect a /signin se non auth, gestione redirect a /onboarding se profile incompleto.

9. Crea route groups con layout: (auth), (dashboard), (client), (marketing).

10. Crea .env.example con tutte le variabili documentate in CLAUDE.md.

==== PARTE 2: SCHEMA DATABASE ====

11. Crea migrazione SQL in /supabase/migrations/00001_initial_schema.sql con tutte le tabelle del PRD §5.2:
    profiles, client_workspaces, workspace_members, projects, milestones, files, messages, invoices, templates.
    Per ogni tabella: tutti i campi, indici su FK e campi filtrati spesso, trigger updated_at.

12. Crea migrazione 00002_rls_policies.sql con RLS abilitato su tutte le tabelle e policy come da PRD §5.3.
    Crea funzione SQL helper is_workspace_member(workspace_uuid, user_uuid) usata dalle policy.

13. Crea migrazione 00003_auth_triggers.sql con trigger handle_new_user che crea automaticamente un record in profiles quando si registra un auth.user.

14. Crea seed in /supabase/seed.sql con 15 template iniziali (3 per verticale: web_dev, architect, photographer, accountant, smm). Ogni template ha default_milestones come JSON array realistico per quella professione.

15. Genera tipi TypeScript del DB in /src/types/database.types.ts. Aggiungi script package.json: "db:types": comando per rigenerarli.

16. Documenta in CLAUDE.md (sezione "Database setup") i comandi per applicare le migrazioni a Supabase.

==== PARTE 3: AUTH E ONBOARDING ====

17. Implementa /signup: form email+password con validazione Zod, signup con Google OAuth. Server Action signupWithEmail. Su successo redirect a /onboarding.

18. Implementa /signin: form email+password e Google. Su successo redirect a /dashboard se profile completo, altrimenti /onboarding.

19. Implementa /onboarding con 3 step controllati da query param o stato locale:

    Step 1 - Scelta verticale (riferimento visivo: docs/screens/06-onboarding-step1.png):
    - 5 card per i verticali (web_dev, architect, photographer, accountant, smm)
    - Hero copy "Cosa fai nella vita?" come da screenshot
    - Card con icona astratta indigo (usa lucide-react: Code, Building2, Camera, Calculator, Megaphone)
    - Tags pill, descrizione, "Template inclusi: N"
    - Selezione cambia stato visivo (border indigo)
    - Link sottile "La mia professione non è qui →" sotto le card
    - CTA "Continua" disabled finché non si seleziona

    Step 2 - Dati profilo:
    - Form con full_name (required), vat_number (required, validazione formato P.IVA italiana), fiscal_regime (select forfettario/ordinario), iban (opzionale, validazione formato), logo upload (Supabase Storage bucket "profile-logos", max 2MB, jpg/png)
    - Validazione Zod sia client (react-hook-form) sia server (Server Action)

    Step 3 - Primo workspace cliente (skippabile):
    - Form essenziale: client_name, client_email, client_type (select privato/azienda/PA)
    - Bottone "Salta, lo faccio dopo" + bottone "Crea workspace"
    - Su submit, crea client_workspace e workspace_members record

20. Crea Server Actions in /src/actions/onboarding.ts: completeStep1, completeStep2, completeStep3.

21. Aggiorna middleware: se utente loggato ma profile.vertical è null, forza redirect a /onboarding.

==== VINCOLI ====

- Non implementare ancora dashboard, workspace detail, progetti. Saranno nel Batch B.
- Non implementare ancora invio email reale dei magic link. Sarà nel Batch C.
- TypeScript strict, no any.
- Server Components di default, 'use client' solo dove necessario.
- Tutti i form con Zod + react-hook-form.
- Test manuale dei flussi prima di considerare il batch completo.

==== OUTPUT ATTESO ====

Repo funzionante in npm run dev. Posso:
- Registrarmi su /signup con email
- Vedermi proposto /onboarding step 1 con 5 card verticali
- Selezionare un verticale, completare step 2 con dati profilo, completare step 3 (o skippare)
- Ritrovarmi su /dashboard (anche solo placeholder vuoto per ora)
- Riloggarmi successivamente e arrivare direttamente a /dashboard senza ripassare da onboarding

Quando hai finito, fai commit "feat: batch A - fondamenta (auth + schema + onboarding)" e dimmi se hai trovato decisioni da chiarire o blocker.
```

**Validazione end-to-end (TU, prima di passare al Batch B):**

- [ ] `npm run dev` parte senza errori
- [ ] `npm run lint` passa
- [ ] Signup nuovo utente funziona via email/password
- [ ] Signup nuovo utente funziona via Google OAuth
- [ ] Onboarding step 1 mostra 5 card verticali, selezionabili, CTA si attiva
- [ ] Onboarding step 2 valida correttamente P.IVA italiana e IBAN
- [ ] Logo upload funziona, file appare in Supabase Storage
- [ ] Onboarding step 3 crea record in client_workspaces
- [ ] Skip step 3 funziona
- [ ] Logout e nuovo login portano direttamente a /dashboard se profile completo
- [ ] Verifica con SQL editor di Supabase: tutte le tabelle create, RLS attivo, 15 template seed presenti
- [ ] Test RLS: provare a leggere profile di altro utente da Supabase → deve fallire

**Cosa fare se qualcosa non va.** Documenta il problema in `docs/sprint-log.md` (sprint 0/1), correggi con prompt mirati a Claude Code, NON passare al Batch B finché tutto è verde.

---

### BATCH B — Workspace Core

**Obiettivo:** dashboard freelance funzionante con lista workspace, dettaglio workspace con tab progetti/file/messaggi, CRUD progetti e milestone, upload file, chat workspace. Il freelance può gestire end-to-end il rapporto con un cliente lato suo (senza ancora la vista cliente reale, che è nel Batch C).

**Riferimenti visivi:** `docs/screens/01-dashboard-freelance.png`, `docs/screens/02-workspace-cliente-freelance.png`, `docs/screens/03-progetto-milestone.png`

**Prompt da incollare in Claude Code:**

```
Leggi CLAUDE.md, docs/PRD.md (sezioni 4.1.2-4.1.5, 5.2-5.3), e questi screenshot:
- docs/screens/01-dashboard-freelance.png (dashboard principale)
- docs/screens/02-workspace-cliente-freelance.png (vista interna workspace)
- docs/screens/03-progetto-milestone.png (dettaglio progetto)

OBIETTIVO BATCH B: implementa dashboard, gestione workspace, progetti+milestone, file e messaggi.

==== PARTE 1: DASHBOARD E SIDEBAR ====

1. Crea layout /src/app/(dashboard)/layout.tsx con:
   - Sidebar fissa 240px sinistra: logo [NOME_APP] + sottotitolo "Freelance Workspace", menu Dashboard/Fatture/Impostazioni/Piano con stato attivo
   - User card in fondo sidebar con avatar (iniziali), nome, badge tier (Free/Pro/Studio)
   - Top bar 64px: bell icon, eventuale CTA contestuale, search input dove ha senso

2. Implementa /(dashboard)/dashboard:
   - 3 stat card top: "Workspace attivi", "Fatture in attesa", "Incassato questo mese". Calcolare via query SQL aggregata.
   - Filter pills: Tutti / Attivi / Archiviati
   - Grid 3 colonne di workspace card: avatar iniziali con colore custom (auto-generato deterministico da client_name), nome cliente, badge tipo (Azienda/Privato/PA), stats "N progetti attivi · M fatture in sospeso", barra avanzamento aggregato (segmenti colorati per stato progetti), "Aggiornato N tempo fa"
   - CTA "+ Nuovo workspace cliente" che apre dialog con form completo anagrafica

3. Crea componente NewWorkspaceDialog con form Zod (client_name, type, email, phone, vat, sdi_code, address). Server Action createWorkspace.

==== PARTE 2: VISTA WORKSPACE INTERNA ====

4. Implementa /(dashboard)/workspace/[id]/layout.tsx con:
   - Breadcrumb "Dashboard / [Nome cliente]"
   - Header workspace: avatar large iniziali, nome cliente come H1 serif, riga meta (badge tipo, P.IVA, email, città), bottone "Apri vista cliente" outlined con external-link icon, bottone "+ Nuova fattura" primario nero
   - Tabs: Progetti, File, Messaggi, Fatture, Impostazioni (Fatture wireframe placeholder per ora, sarà nel Batch D)
   - Layout 2 colonne: main 70% + right sidebar 30% con card "Riepilogo cliente" e "Attività recenti"

5. Implementa /workspace/[id]/page.tsx (default tab Progetti):
   - Filter pills: Tutti / Attivi / Completati / Bozze
   - Lista verticale di project card

==== PARTE 3: PROGETTI E MILESTONE ====

6. Project card design (da screenshot 02):
   - Badge tipo "PROGETTO A CONSEGNE" (lavanda) o "SERVIZIO RICORRENTE" (indigo) o "BOZZA" (grigio)
   - Title H3 serif, descrizione
   - Status row con dot colorato + testo
   - Per deliverable: timeline orizzontale milestone con cerchi (vuoto/mezzo/pieno) e label sotto
   - Per recurring: timeline mensile con pillole (mesi passati pieni, corrente evidenziato, futuri vuoti)
   - Bottom row: meta importo + scadenza/rinnovo

7. Implementa /workspace/[id]/projects/[projectId]/page.tsx (riferimento screenshot 03):
   - Header card: badge tipo, status, title H1 serif, descrizione, riga stat (Importo totale, Avanzamento %, Date)
   - Sezione "Milestone" con vertical list di milestone card. Ogni card:
     - Cerchio stato a sinistra (50px): vuoto / mezzo riempito / pieno con checkmark
     - Bordo sinistro 3px colorato (sage=approvata, indigo=in corso, neutro=todo)
     - Title, description, meta (consegnata il / approvata il / fattura collegata)
     - Importo + pill stato (PAGATA, FATTURA INVIATA, IN CORSO, DA FARE)
     - Per milestone "in corso": sub-section "Note interne" + bottoni "Marca come consegnata" e "Modifica"
   - Card dashed "+ Nuova milestone" full width
   - Sezione "File del progetto" sotto (riferimento ai file con visibility=shared/private associati al progetto)
   - Right sidebar: card "Cliente collegato", "Fatture del progetto", "Conversazioni del progetto", "Attività progetto"

8. CRUD progetti e milestone:
   - Dialog "Nuovo progetto" con scelta tipo deliverable/recurring
   - Per deliverable: form con title, description, dates, total_amount, select template (carica milestone da template seed)
   - Per recurring: form title, recurring_period (monthly/quarterly), recurring_amount
   - CRUD milestone con drag-drop reorder (usa @dnd-kit/sortable)
   - Server Actions: createProject, updateProject, deleteProject, createMilestone, updateMilestoneStatus, reorderMilestones

==== PARTE 4: FILE E STORAGE ====

9. Crea bucket Supabase Storage "workspace-files" privato. Aggiungi policy storage che usa is_workspace_member.

10. Implementa /workspace/[id]/files/page.tsx:
    - Drag & drop area con react-dropzone (o native HTML5)
    - Limite 100MB validato client + server
    - Selettore visibility (privato/condiviso) e progetto associato (opzionale)
    - Versioning: stesso filename+project_id incrementa version
    - Grid di file card con preview (immagini), icona tipo, nome, size, version, badge visibility
    - Anteprima inline immagini, PDF (iframe)
    - Download via URL signed expiring 1 ora
    - Soft delete con deleted_at, recuperabile per 30 giorni

11. Quote storage per piano. Visualizza usage corrente in sidebar dashboard (es. "12.4 GB / 20 GB usati"). Per ora hardcoded basato su profile.subscription_tier (lo collegheremo a Stripe nel Batch E).

==== PARTE 5: CHAT E MESSAGGI ====

12. Implementa /workspace/[id]/messages/page.tsx:
    - Stream cronologico messaggi (verticale, scroll bottom→top con ultimo messaggio in fondo)
    - Bubble messaggi differenti tra mittente freelance e mittente cliente (allineamento opposto)
    - Avatar mittente, timestamp, indicator "letto"
    - Input textarea con bottone invio, pulsanti allegato (link a file workspace o upload diretto)
    - Possibilità di taggare messaggio a progetto/milestone (dropdown)
    - Realtime subscription Supabase per nuovi messaggi (solo lato freelance per ora, cliente nel Batch C)

13. Server Action sendMessage con: parsing tag, eventuale upload file, persist in DB, trigger update lastReadAt per il mittente.

==== PARTE 6: SIDEBAR DESTRA WORKSPACE ====

14. Card "Riepilogo cliente": Progetti totali, Fatturato totale, Cliente da (data), Tempo medio pagamento (calcolato da fatture pagate, NULL se zero fatture pagate).

15. Card "Attività recenti": stream ultimi 10 eventi del workspace (creazione progetti, milestone consegnate/approvate, file caricati, messaggi). Crea tabella SQL workspace_activity_log popolata da trigger DB su insert/update di altre tabelle, oppure aggregazione SQL on-the-fly se più semplice.

==== VINCOLI ====

- NO vista cliente reale (Batch C). I link "Apri vista cliente" possono essere placeholder.
- NO fatture (Batch D).
- NO billing Stripe (Batch E).
- Email notifications per nuovo messaggio: rimanda al Batch C/F.
- Server Components di default. Realtime e drag-drop richiedono 'use client'.
- Empty states curati su tutte le pagine (no progetti, no file, no messaggi).

==== OUTPUT ATTESO ====

Posso, come freelance:
- Vedere dashboard con miei workspace e stat aggregate
- Creare un nuovo workspace cliente
- Aprire un workspace e vedere tab Progetti/File/Messaggi
- Creare un progetto deliverable scegliendo un template, vedere milestone precaricate
- Creare un progetto recurring
- Aggiornare lo stato delle milestone (todo → in corso → consegnata → approvata)
- Riordinare milestone con drag-drop
- Caricare file con visibility privata o condivisa
- Mandare messaggi nel workspace (anche se il cliente non li riceve ancora reali)
- Vedere sidebar destra con riepilogo cliente e attività recenti

Quando hai finito, commit "feat: batch B - workspace core (dashboard + progetti + file + messaggi)".
```

**Validazione end-to-end:**

- [ ] Dashboard mostra stat corrette (somma da DB)
- [ ] Creazione workspace nuovo funziona, appare nella griglia
- [ ] Apertura workspace mostra header completo con anagrafica
- [ ] Tab "Progetti" lista progetti vuota → "+ Nuovo progetto" → form con template select → progetto creato con milestone precaricate
- [ ] Drag-drop reorder milestone persiste correttamente
- [ ] Upload file >100MB respinto, ≤100MB accettato
- [ ] File con visibility=private NON visibile da altro utente in test (verifica via SQL)
- [ ] Messaggi inviati appaiono in real-time se apro la pagina in due tab
- [ ] Sidebar "Attività recenti" si aggiorna dopo ogni azione
- [ ] Tutti gli empty state sono curati visivamente
- [ ] Nessun errore console, nessun warning React

---

### BATCH C — Vista Cliente

**Obiettivo:** il cliente del freelance può accedere via magic link al suo workspace, vedere progetti, approvare milestone, scaricare file (solo shared), chattare, ricevere notifiche email. La vista cliente è branded col profilo del freelance.

**Riferimenti visivi:** `docs/screens/04-vista-cliente.png`

**Perché batch isolato:** la vista cliente vive in un route group separato `(client)`, ha layout, sessione e auth completamente diversi dal lato freelance. Mescolarla con altri batch creerebbe confusione e rischio di leak di policy RLS.

**Prompt da incollare in Claude Code:**

```
Leggi CLAUDE.md, docs/PRD.md (sezioni 4.1.2 vista cliente, 4.1.5 comunicazione, 5.6 sicurezza), e screenshot:
- docs/screens/04-vista-cliente.png

OBIETTIVO BATCH C: implementa la vista cliente accessibile via magic link, con auth custom basata su token e UI distinta dal lato freelance.

==== PARTE 1: SISTEMA MAGIC LINK ====

1. Genera invite_token UUID v4 quando si crea workspace_member con role=client. Salvalo in DB.

2. Crea Server Action sendClientInvite(workspace_id):
   - Genera (o riusa) invite_token
   - Costruisce URL magic link: ${NEXT_PUBLIC_APP_URL}/client/${invite_token}
   - Manda email via Resend usando template "Invito al workspace di [Freelance Name]"
   - Email branded con logo e brand_color del freelance, copy in italiano caldo

3. UI lato freelance (estendi /workspace/[id]/settings):
   - Sezione "Invita cliente" con email cliente readonly (da workspace data)
   - Bottone "Invia invito email" che chiama sendClientInvite
   - Mostra link magico copiabile (textarea readonly + bottone "Copia")
   - Stato "Invito inviato il ..." dopo invio

==== PARTE 2: AUTH SESSIONE CLIENTE ====

4. Implementa middleware che intercetta /client/[token]:
   - Cerca workspace_members con invite_token matching e accepted_at NULL OR > 90 giorni fa
   - Se valido: crea sessione client custom (cookie httpOnly firmato JWT con workspace_member_id, workspace_id, expiry 90 giorni)
   - Se invalido/scaduto: redirect a /client/expired con messaggio "Link non valido o scaduto, chiedi al freelance di rigenerarlo"
   - Aggiorna accepted_at al primo accesso

5. Crea helper getClientSession() che legge cookie e ritorna { workspace_member_id, workspace_id } o null. Usato in tutte le pagine /client/*.

6. La sessione cliente NON usa Supabase Auth. È sessione applicativa pura. Le query Supabase usano un client SERVER-SIDE che controlla manualmente che workspace_id matching prima di fare query.

7. IMPORTANTE: per coerenza con RLS, crea funzione SQL alternativa get_client_workspace_id() che legge da claim JWT custom. Per ora, dato che usiamo session applicativa, le query lato cliente vanno fatte SEMPRE filtrando esplicitamente per workspace_id ottenuto dalla sessione, NON affidandosi a RLS auth.uid(). Questo richiede helper centralizzati per evitare bypass.

==== PARTE 3: LAYOUT E PAGINE CLIENTE ====

8. Implementa /(client)/layout.tsx (riferimento screenshot 04):
   - Sfondo cream #FAF7F2 (più caldo del lato freelance)
   - Top bar 80px white con: avatar freelance + nome + sottotitolo professione, nav orizzontale "Panoramica/Progetti/File/Messaggi/Fatture", in alto a destra nome cliente + dropdown logout
   - Brand color del freelance applicato come accent (border, button primario, link active)
   - Footer minimale con "Workspace gestito con [NOME_APP]" (nascosto se freelance è tier Studio = white-label completo)

9. Implementa /(client)/[token]/page.tsx (Panoramica, screenshot 04):
   - Hero "BENTORNATO" + H1 serif "Ciao [Nome cliente], ecco a che punto siamo"
   - Sottotitolo "Ultimo aggiornamento da [Freelance]: [tempo]"
   - 2 colonne: progetti card a sinistra, sidebar destra con Riepilogo / Ultima fattura / Messaggi recenti
   - Card progetti versione "calma": progress bar orizzontale con label sotto (4 fasi tipo Mockup ✓ / Sviluppo ✓ / Contenuti (in corso) / Deploy), frase status conversazionale ("Stiamo finalizzando..."), CTA contestuale (es. "Carica foto")
   - Sezione "Cosa serve da te" con action items checkbox: "Carica 3 foto galleria", "Approva milestone X"

10. Implementa /(client)/[token]/projects/[projectId]/page.tsx:
    - Vista progetto cliente: timeline milestone come barra orizzontale con label, NON i cerchi tecnici
    - Per milestone in stato "delivered": bottone grande "Approva consegna" + "Richiedi modifiche"
    - Lista file del progetto (solo visibility=shared)
    - Storico approvazioni cliente

11. Implementa /(client)/[token]/files/page.tsx:
    - Lista solo file con visibility=shared
    - Anteprima e download via URL signed
    - NO upload (cliente è readonly su file per ora; eventuali upload da action specifiche tipo "carica foto richieste" nel V2)

12. Implementa /(client)/[token]/messages/page.tsx:
    - Stessa chat del freelance ma allineamento opposto (cliente bubble destra, freelance sinistra)
    - Indicator "il freelance sta scrivendo..." se possibile via Supabase Realtime presence
    - Notifica email al freelance via Resend quando cliente manda messaggio

13. /(client)/[token]/invoices/page.tsx (placeholder per ora, completato nel Batch D).

==== PARTE 4: APPROVAZIONI ====

14. Server Action approveMilestone(milestone_id, client_session):
    - Verifica che milestone appartenga a workspace di sessione cliente
    - Verifica milestone in stato "delivered"
    - Set status = "approved", approved_at = now()
    - Notifica freelance via email
    - Log in workspace_activity

15. Server Action requestMilestoneRevision(milestone_id, message, client_session):
    - Crea messaggio automatico nel workspace con il commento del cliente
    - Lascia milestone in stato "delivered" (non torna indietro a in_progress, ma freelance vede il messaggio)
    - Notifica freelance via email

==== PARTE 5: EMAIL TEMPLATES ====

16. Crea template Resend in /src/lib/resend/templates/:
    - ClientInvite.tsx: invito iniziale cliente
    - NewMessage.tsx: notifica nuovo messaggio (al freelance o cliente)
    - MilestoneApproved.tsx: al freelance quando cliente approva
    - MilestoneRevisionRequested.tsx: al freelance quando cliente chiede modifiche

17. Tutti i template react-email, branded con logo + brand_color del freelance, italiano caldo.

==== VINCOLI ====

- Sicurezza paranoica: la sessione cliente NON deve permettere accesso a workspace diversi dal proprio. Test esplicito.
- Magic link single-use opzionale: per ora multi-use con expiry 90 giorni, ma azioni sensibili (approvazione fatture, eliminazioni) richiedono freshness <24h (gestiremo nel Batch D per fatture).
- Realtime presence è nice-to-have, opzionale se complica.
- White-label: tier "studio" nasconde completamente "Powered by [NOME_APP]" nel footer e nella tab title.

==== OUTPUT ATTESO ====

Come freelance posso:
- Aprire workspace, andare in Settings, cliccare "Invia invito email" → cliente riceve email branded
- Cliente clicca link → atterra su vista cliente accogliente con suo nome
- Cliente vede progetti, file (solo shared), messaggi, riepilogo
- Cliente può approvare milestone delivered → io ricevo email + vedo milestone approved nel mio workspace
- Cliente può chiedere modifiche → io ricevo email + il commento appare in chat workspace
- Se sono tier Studio, il branding [NOME_APP] è nascosto

Quando hai finito, commit "feat: batch C - vista cliente con magic link e approvazioni".
```

**Validazione end-to-end:**

- [ ] Invito email arriva, layout email è gradevole, colori del freelance applicati
- [ ] Click su magic link → atterro sulla vista cliente con saluto personalizzato
- [ ] Cookie sessione cliente è httpOnly e firmato (verifica DevTools)
- [ ] Test sicurezza: provo ad aprire /client/[token-altro-workspace] → blocco
- [ ] Test sicurezza: copio cookie sessione, modifico workspace_id manualmente → blocco
- [ ] Cliente vede solo file con visibility=shared (verifica con file privato esistente)
- [ ] Approvazione milestone funziona, freelance riceve email immediata
- [ ] Richiesta revisione crea messaggio in chat workspace
- [ ] Realtime chat funziona da entrambi i lati
- [ ] Tier Studio: footer "Workspace gestito con" sparisce
- [ ] Magic link scaduto (forza expiry in DB) → redirect a /client/expired

---

### BATCH D — Fatturazione

**Obiettivo:** fatturazione manuale e tracking pagamenti completi, integrazione con Pyva per emissione SDI con bozze precompilate. Dashboard cash flow operativa. Reminder automatici al cliente.

**Riferimenti visivi:** `docs/screens/05-fatture-cashflow.png`

**Prerequisito critico:** allineamento con team Pyva per gli endpoint API necessari (vedi PRD §5.5). Se non sono pronti, il batch si esegue con un mock client che simula le risposte; l'integrazione vera viene attivata via feature flag dopo.

**Prompt da incollare in Claude Code:**

```
Leggi CLAUDE.md, docs/PRD.md (sezioni 4.1.6, 4.1.7, 5.5), e screenshot:
- docs/screens/05-fatture-cashflow.png

OBIETTIVO BATCH D: implementa fatturazione tracking, dashboard cash flow, integrazione Pyva (con fallback mock).

==== PARTE 1: FATTURAZIONE MANUALE ====

1. Implementa /(dashboard)/fatture/page.tsx (riferimento screenshot 05):
   - Card "Flusso di cassa" full-width con 4 stat block: Incassato questo mese (+%), In attesa (€ + n.fatture), Scadute (€ in coral + n), Bozze (€ + n)
   - Bar chart impilato 6 mesi: barra grigio chiaro (fatturato totale) con porzione nera (incassato)
   - Filter pills stato: Tutte / Bozze / Inviate / Pagate / Scadute
   - Search input "Cerca per cliente o numero fattura"
   - Filtro periodo (date picker)
   - Tabella fatture con colonne: N° / Cliente (avatar+nome) / Progetto / Emessa / Scadenza (coral se overdue) / Importo (tabular bold) / Stato (pill colorato con backdrop) / Azioni (3-dots menu)
   - Bordo sinistro 3px riga: sage=pagata, indigo=inviata, coral=scaduta, neutro=bozza
   - Pagination
   - Banner Pyva sotto tabella se non connesso (sage chiaro): "Connetti Pyva per emettere fatture SDI con un click"

2. Implementa /(dashboard)/fatture/[id]/page.tsx: dettaglio fattura editabile.

3. Implementa /(dashboard)/workspace/[id]/invoices/ tab: lista fatture filtrate per workspace, con stessa UI base.

4. Server Actions:
   - createInvoice(input): crea bozza con numero progressivo automatico (formato YYYY/NNN per anno)
   - issueInvoice(id): da bozza a issued, set issue_date = today, due_date default +30gg
   - markAsPaid(id, paid_at): marca pagata manualmente
   - cancelInvoice(id): soft cancel (status=cancelled)
   - linkInvoiceToMilestone(id, milestone_id): collegamento con milestone (auto-precompila)

5. Form nuova fattura:
   - Workspace cliente (select)
   - Progetto/milestone (select dipendente, opzionale)
   - Numero (autofill progressivo, editabile)
   - Date emissione/scadenza
   - Importo
   - Modalità pagamento (radio): bonifico (mostra IBAN del freelance), Stripe link (campo URL Stripe Checkout), PayPal.me (link)
   - Causale auto-generata "Fattura n.X del DD/MM/YYYY", editabile
   - Upload PDF (per fatture emesse altrove, es. caso "manuale")

6. Stato fattura calcolato dinamicamente:
   - draft: bozza
   - issued: issue_date set, due_date >= today
   - overdue: due_date < today AND paid_at NULL
   - paid: paid_at NOT NULL
   - cancelled: status=cancelled

==== PARTE 2: VISTA CLIENTE FATTURE ====

7. Implementa /(client)/[token]/invoices/page.tsx:
   - Lista fatture in stato issued/overdue (mai bozze)
   - Card per fattura con: numero, importo grande, data, status pill, descrizione, bottone "Scarica PDF"
   - Per fatture issued non pagate: bottoni "Paga con carta" (link Stripe se configurato) e "Bonifico" (mostra IBAN copiabile + causale)
   - Sezione fatture pagate (collassabile, archivio)

8. Quando cliente clicca "Paga con carta":
   - Redirect a Stripe Checkout link configurato dal freelance per quella fattura
   - Webhook Stripe (lo configuriamo nel Batch E ma stub qui) marca paid_at quando completato

==== PARTE 3: REMINDER AUTOMATICI ====

9. Configura cron Vercel daily (vercel.json):
   - /api/cron/update-overdue: aggiorna stato fatture in overdue
   - /api/cron/payment-reminders: invia email reminder al cliente

10. Logica reminder:
    - 3 giorni prima scadenza: "Reminder: la fattura n.X scade tra 3 giorni"
    - Giorno scadenza: "Oggi scade la fattura n.X"
    - 7 giorni dopo scadenza: "Sollecito: fattura n.X scaduta da 7 giorni"
    - 14 giorni dopo scadenza: "Sollecito 2: fattura n.X scaduta da 14 giorni"
    - Possibilità per il freelance di disabilitare reminder per singola fattura (campo silence_reminders bool)

11. Email template PaymentReminder.tsx + branding freelance.

==== PARTE 4: INTEGRAZIONE PYVA ====

12. Crea /src/lib/pyva/client.ts: client API Pyva con metodi:
    - testConnection(api_key): verifica validità credenziali
    - createDraftInvoice(input): crea bozza fattura
    - getInvoiceStatus(invoice_id): polling stato SDI
    - listInvoices(filters): elenco

13. IMPORTANTE: implementare con dual-mode controllato da env var PYVA_MOCK=true|false:
    - mock=true: client logga le call e ritorna risposte fake realistiche (per dev e test prima che endpoint Pyva siano pronti)
    - mock=false: client fa vere call HTTP a PYVA_API_BASE_URL

14. UI integrazione in /(dashboard)/settings/integrations:
    - Card Pyva con stato (Non connesso / Connesso a [account info])
    - Bottone "Connetti Pyva" apre dialog: input API key + Test connessione
    - On save: cifra API key con AES-256 (ENCRYPTION_KEY env var) e salva in profiles.pyva_api_key_encrypted
    - Bottone "Disconnetti" rimuove

15. Quando Pyva connesso, nel form nuova fattura:
    - Bottone aggiuntivo "Crea fattura in Pyva" oltre a "Crea manuale"
    - Click → Server Action createInvoiceViaPyva: precompila da progetto/milestone, chiama pyva.createDraftInvoice, salva invoices con source=pyva, external_id, status=draft
    - Modal di conferma: "Bozza creata in Pyva. [Apri Pyva per finalizzare invio SDI →]" con link diretto

16. Webhook handler /api/webhooks/pyva:
    - Verifica signature (HMAC con shared secret in env)
    - Eventi gestiti: invoice.issued, invoice.sdi_status_update, invoice.paid
    - Match invoices riga su external_id
    - Aggiorna status, pdf_url, xml_url
    - Notifica freelance via email (es. "SDI scartata - controlla in Pyva" è urgente)

17. Documenta in docs/PYVA_INTEGRATION.md gli endpoint richiesti lato Pyva (input/output, esempi di payload). Questo documento sarà condiviso col team Pyva per allineamento.

==== VINCOLI ====

- Calcoli automatici: marca da bollo €2 quando importo > €77.47 e regime forfettario (mostra warning info, non blocco)
- NO emissione SDI diretta da [NOME_APP]: solo via Pyva
- Mock mode è DEFAULT in dev, va attivato esplicitamente in prod via env var
- Tutte le mutazioni hanno audit log su tabella audit_logs (crea migrazione 00004)

==== OUTPUT ATTESO ====

Come freelance posso:
- Vedere /fatture con dashboard cash flow corretta
- Creare bozza fattura manuale, emetterla, marcarla come pagata
- Caricare PDF di fattura emessa altrove e tracciarla
- Connettere Pyva (mock mode in dev)
- Da una milestone, creare fattura in Pyva con dati precompilati
- Vedere stato SDI tornare via webhook (simulato in mock mode)
- Cliente vede fatture, può cliccare "Paga con carta" o "Bonifico"
- Cron giornaliero aggiorna overdue e manda reminder

Quando hai finito, commit "feat: batch D - fatturazione tracking + integrazione Pyva (mock-ready)".
```

**Validazione end-to-end:**

- [ ] Dashboard cash flow mostra numeri corretti (verifica con SQL diretto)
- [ ] Bar chart impilato corretto su 6 mesi
- [ ] Creazione bozza → issued → paid funziona
- [ ] Numero progressivo è continuo (no gap, no duplicati) anno per anno
- [ ] Cliente vede fattura, scarica PDF, vede IBAN+causale per bonifico
- [ ] Test cron localmente: forza esecuzione → email reminder arriva
- [ ] Stato overdue calcolato correttamente al cron
- [ ] Connessione Pyva mock funziona (logs visibili)
- [ ] Da milestone → "Crea in Pyva" → fattura draft creata con source=pyva
- [ ] Webhook Pyva mock-simulato aggiorna invoice status
- [ ] API key Pyva è cifrata in DB (verifica con SQL)
- [ ] docs/PYVA_INTEGRATION.md è completo e condivisibile

---

### BATCH E — Subscription SaaS

**Obiettivo:** Stripe subscription per [NOME_APP] con tier Free/Pro/Studio, trial 14 giorni, gestione lifecycle, enforcement limiti, dashboard billing self-service.

**Prompt da incollare in Claude Code:**

```
Leggi CLAUDE.md, docs/PRD.md (sezione 6 Pricing).

OBIETTIVO BATCH E: implementa subscription SaaS Stripe con 3 tier, trial, enforcement limiti, billing self-service.

==== PARTE 1: SETUP STRIPE ====

1. Documenta in docs/STRIPE_SETUP.md i prodotti da creare manualmente su Stripe Dashboard (test mode):
   - [NOME_APP] Pro Mensile: 19 EUR/mese
   - [NOME_APP] Pro Annuale: 180 EUR/anno (sconto 20%)
   - [NOME_APP] Studio Mensile: 39 EUR/mese
   - [NOME_APP] Studio Annuale: 374 EUR/anno
   - Per ognuno: feature lookup_key consistente (es. pro_monthly, pro_yearly)

2. Aggiungi env vars Stripe price IDs in .env.example: STRIPE_PRICE_PRO_MONTHLY, etc.

3. Crea /src/lib/stripe/client.ts: client server-side e helper.

4. Crea /src/lib/stripe/plans.ts: definizione plan limits in TS (workspace_limit, storage_limit_gb, can_use_pyva, can_white_label, etc.) usato in tutta l'app.

==== PARTE 2: BILLING UI ====

5. Implementa /(dashboard)/billing/page.tsx:
   - Card "Piano corrente" con nome tier, prossimo rinnovo, importo
   - Stat utilizzo: workspace usati / totale, storage usato / totale, integrazioni attive
   - Bottoni "Cambia piano" / "Gestisci pagamenti" / "Annulla" come da stato
   - Tabella confronto piani Free vs Pro vs Studio

6. Server Action createCheckoutSession(price_id, tier):
   - Crea o riusa stripe.customers (collega via profiles.stripe_customer_id)
   - Crea checkout session con success_url e cancel_url
   - Per primo upgrade: trial_period_days=14
   - Ritorna URL → redirect client

7. Server Action createBillingPortalSession():
   - Crea portal session Stripe per gestione self-service
   - Redirect client

==== PARTE 3: WEBHOOK STRIPE ====

8. /api/webhooks/stripe:
   - Verifica signature con STRIPE_WEBHOOK_SECRET
   - Eventi gestiti:
     - checkout.session.completed: aggiorna profiles.subscription_tier, status=active, stripe_customer_id, stripe_subscription_id
     - customer.subscription.updated: sync status (active, trialing, past_due, canceled)
     - customer.subscription.deleted: tier=free, status=canceled
     - invoice.payment_failed: notifica utente via email "Pagamento fallito, aggiorna metodo"
     - customer.subscription.trial_will_end: 3 giorni prima fine trial, email "Trial in scadenza"

9. Idempotenza: log eventi processati in tabella stripe_webhook_events (event_id PK), skip se già processato.

==== PARTE 4: ENFORCEMENT LIMITI ====

10. Crea helper /src/lib/limits.ts: checkWorkspaceLimit(profile), checkStorageLimit(profile), canUsePyva(profile), canWhiteLabel(profile).

11. Applica limiti:
    - createWorkspace Server Action: blocca se workspace_count >= profile.tier.workspace_limit
    - File upload: blocca se size_bytes_total + new_file > profile.tier.storage_limit
    - Connessione Pyva: blocca se !canUsePyva(profile)
    - White-label cliente: nascondi "Powered by" se canWhiteLabel(profile)

12. UI gating:
    - Mostra paywall modal/banner quando azione bloccata: "Hai raggiunto il limite del piano Free. Aggiorna a Pro per workspace illimitati"
    - CTA "Vedi piani" → /billing

==== PARTE 5: TRIAL E ONBOARDING UPGRADE ====

13. Quando utente completa onboarding (post Batch A), invialo opzionalmente a banner "Prova Pro gratis 14 giorni" (non forza, è opt-in).

14. Email template TrialStarted, TrialEndingSoon (3gg before), TrialExpired, PaymentFailed.

15. Cron daily controllo trial: utenti con trial finito da 24h e no metodo pagamento → downgrade a free.

==== VINCOLI ====

- Test mode Stripe SEMPRE in dev. Production Stripe attivato solo con feature flag esplicito.
- Webhook locale durante dev: documentare uso di stripe listen --forward-to localhost:3000/api/webhooks/stripe
- I price ID Stripe NON sono hardcoded in TS: solo via env var
- Trial: 14 giorni gratis senza richiesta carta (Stripe allow_promotion_codes=false, payment_method_collection=if_required)

==== OUTPUT ATTESO ====

Come freelance posso:
- Da /billing vedere il mio piano (free di default)
- Cliccare upgrade Pro → Stripe Checkout in trial mode
- Completare con carta test 4242... → tornare a app con tier=pro
- Vedere dashboard con limiti del nuovo tier
- Aprire customer portal Stripe per cambiare metodo / annullare
- Disabbonarmi → tier torna a free al prossimo rinnovo
- Limiti enforced: come free non posso creare 2° workspace, come pro sì
- Email transazionali Stripe (welcome, trial-ending, payment-failed) ricevute correttamente

Quando hai finito, commit "feat: batch E - subscription stripe con trial e limit enforcement".
```

**Validazione end-to-end:**

- [ ] Free user: blocco creazione 2° workspace con paywall
- [ ] Upgrade Pro via Stripe test → tier aggiornato in DB → limiti rimossi
- [ ] Customer portal funziona, posso cambiare carta
- [ ] Annullamento subscription → status=canceled → al rinnovo tier=free
- [ ] Trial 14 giorni: posso usare Pro features per 14 giorni senza carta
- [ ] Trial finito senza carta → downgrade automatico
- [ ] Webhook idempotency: rilanciare stesso event 2 volte non duplica side-effects
- [ ] Email payment_failed arriva e linka a billing portal

---

### BATCH F — Polish e Lancio

**Obiettivo:** prodotto pronto per lancio beta. Email transazionali tutte branded, observability operativa, 5 landing pages SEO, onboarding tour, empty states, pagine legali, performance OK.

**Prompt da incollare in Claude Code:**

```
Leggi CLAUDE.md, docs/PRD.md (sezione 7 GTM, 8.2 milestone post-MVP).

OBIETTIVO BATCH F: polish completo, landing pages, observability, lancio beta-ready.

==== PARTE 1: EMAIL TRANSAZIONALI ====

1. Verifica e completa template Resend in /src/lib/resend/templates/, tutti react-email branded:
   - WelcomeAfterSignup.tsx
   - ClientInvite.tsx (esistente, polish)
   - NewMessage.tsx (esistente, polish)
   - MilestoneDelivered.tsx (al cliente)
   - MilestoneApproved.tsx (al freelance)
   - InvoiceIssued.tsx (al cliente)
   - PaymentReminder.tsx (esistente)
   - PaymentReceived.tsx (al freelance)
   - TrialStarted.tsx (esistente)
   - TrialEndingSoon.tsx (esistente)
   - PaymentFailed.tsx (esistente)
   - WeeklyDigest.tsx (al freelance, opzionale settimanale, opt-in)

2. Tutti email: header con logo, footer con unsubscribe, italiano caldo, brand color usato come accent.

==== PARTE 2: LANDING PAGES ====

3. Implementa landing pages SEO in /(marketing):
   - /(marketing)/page.tsx: homepage generica con messaggio universale
   - /(marketing)/per/sviluppatori/page.tsx
   - /(marketing)/per/architetti/page.tsx
   - /(marketing)/per/fotografi/page.tsx
   - /(marketing)/per/commercialisti/page.tsx
   - /(marketing)/per/social-media-manager/page.tsx

4. Struttura uniforme per ogni landing verticale:
   - Hero: headline specifica + CTA "Inizia gratis"
   - Problem: 3 pain points della verticale (testo + icone)
   - Demo: screenshot reali (placeholder PNG, da inserire post-batch dopo aver fatto screenshot reali del prodotto)
   - Features grid 5-6 più rilevanti
   - Testimonial placeholder
   - Pricing tabella
   - FAQ specifiche (4-6)
   - CTA finale

5. SEO: metadata per pagina, schema.org SoftwareApplication, sitemap.xml dinamica, robots.txt.

6. Footer comune: cross-link tutte verticali, pricing, login, privacy, terms.

7. MDX setup per blog futuro (struttura ma vuoto): /(marketing)/blog/[slug].

==== PARTE 3: ONBOARDING TOUR ====

8. Installa driver.js o react-joyride.

9. Tour 5 step al primo login post-onboarding (controllato da profile.has_seen_tour bool):
   - Step 1: dashboard - "Qui vedrai tutti i tuoi workspace cliente"
   - Step 2: + Nuovo workspace - "Crea il tuo primo workspace"
   - Step 3: dentro workspace, tab Progetti - "Gestisci progetti e milestone qui"
   - Step 4: bottone "Apri vista cliente" - "Mostra al cliente cosa vede lui"
   - Step 5: /fatture sidebar - "Gestisci fatture e cash flow"

10. Bottone "Skip tour" sempre visibile. Marca has_seen_tour=true al termine o skip.

==== PARTE 4: EMPTY STATES ====

11. Cura empty state TUTTE le pagine principali, almeno con: illustrazione/icona, titolo, descrizione, CTA primario.

12. Empty state principali:
    - Dashboard senza workspace
    - Workspace senza progetti
    - Progetto senza milestone
    - Workspace senza file
    - Workspace senza messaggi
    - Fatture senza fatture
    - Cliente senza progetti
    - Cliente senza fatture

==== PARTE 5: NOTIFICHE IN-APP ====

13. Header bell icon con dot rosso se notifiche non lette.

14. Dropdown notifiche con stream ultimi 20 eventi: nuovo messaggio, milestone approvata, fattura pagata, trial ending, etc.

15. Tabella notifications: id, user_id, type, title, body, link, read_at, created_at.

16. Trigger SQL su eventi rilevanti per popolare notifications.

==== PARTE 6: OBSERVABILITY ====

17. Sentry configurato server + client (era abbozzato in Batch A, completare).

18. Vercel Analytics + Speed Insights attivi.

19. Plausible o PostHog per product analytics. Eventi tracciati:
    - signup
    - onboarding_completed
    - workspace_created
    - project_created
    - milestone_approved
    - invoice_issued
    - invoice_paid
    - subscription_upgraded
    - subscription_canceled

20. Log strutturato (pino o simile) per eventi business.

==== PARTE 7: PAGINE LEGALI ====

21. /(marketing)/privacy: privacy policy GDPR-compliant template italiano (con placeholder per dati legali da compilare).

22. /(marketing)/terms: termini e condizioni template.

23. /(marketing)/cookie: cookie policy.

24. Cookie banner non invasivo (Klaro o custom): essential cookies sempre, analytics opt-in.

==== PARTE 8: QA E PERFORMANCE ====

25. Setup Playwright con test E2E core flows:
    - Signup + onboarding
    - Crea workspace + progetto + milestone
    - Cliente accede via magic link, approva milestone
    - Crea fattura, marca pagata
    - Upgrade subscription mock

26. Run Lighthouse: target Performance ≥90, Accessibility ≥95, SEO ≥90 su tutte le landing.

27. Mobile responsive: test layout su 375px, 768px, 1024px.

28. Browser test: Chrome, Safari, Firefox.

29. Sicurezza review:
    - Tutti gli endpoint API hanno auth check
    - RLS policies testate con utente diverso
    - Token API cifrati (Pyva, Stripe)
    - No PII in log
    - Rate limiting su endpoint pubblici critici

==== VINCOLI ====

- Tutto deve essere production-ready ma in feature flag "beta": footer/header con banner "Beta v1.0"
- Setup analytics rispetta privacy: opt-in esplicito
- Pagine legali sono template, founder le revisiona con consulente prima del go-live pubblico

==== OUTPUT ATTESO ====

Prodotto beta-ready:
- Tutte email transazionali arrivano e sono belle
- 6 landing pages funzionanti, SEO ok, copy specifico per verticale
- Tour onboarding alla prima volta
- Empty states curati ovunque
- Notifiche in-app live
- Sentry cattura errori, analytics traccia eventi
- Pagine legali presenti
- Test E2E passano
- Lighthouse green
- Mobile responsive

Quando hai finito, commit "feat: batch F - polish, landing, observability, beta-ready" e tagga v1.0.0-beta.
```

**Validazione end-to-end:**

- [ ] Tutte le email arrivano e si vedono bene su Gmail desktop, Gmail mobile, Outlook
- [ ] Le 6 landing aprono in <2s, Lighthouse verde
- [ ] Tour onboarding parte automaticamente, è skippabile
- [ ] Empty states curati su almeno 8 pagine
- [ ] Notifiche in-app appaiono in tempo reale
- [ ] Sentry riceve un errore di test
- [ ] Analytics traccia signup
- [ ] Cookie banner ok, opt-in funzionante
- [ ] Test Playwright passano end-to-end
- [ ] Mobile responsive validato su 3 breakpoint
- [ ] Tag v1.0.0-beta creato

---

### Linee guida operative trasversali

**1. Diario di sprint.** Tieni `docs/sprint-log.md` aggiornato. Per ogni batch annota: cosa hai cambiato rispetto al PRD, decisioni nuove, problemi e soluzioni, tempo effettivo vs stimato. Sarà oro a Batch E quando avrai dimenticato perché certe scelte furono fatte.

**2. Branch git per batch.** `batch-A-fondamenta`, `batch-B-workspace`, etc. Merge in main solo dopo validazione end-to-end completa. Mai mergiare con TODO aperti su feature core.

**3. Aggiornamento CLAUDE.md.** Dopo ogni batch, se sono emerse convenzioni nuove (es. "useremo questa libreria per le date" o "i nomi delle Server Action seguono questo pattern"), aggiornale lì. È il file che Claude Code legge come prima cosa nei batch successivi.

**4. Cosa fare se Claude Code si blocca o devia.** Se a metà batch ti accorgi che sta andando in una direzione sbagliata (architettura non corretta, libreria scelta male, pattern inconsistente), STOP. Non lasciarlo proseguire. Apri un nuovo prompt mirato che corregge la rotta. Meglio perdere mezz'ora di lavoro che propagare errori in 50 file.

**5. Mock-first, real-after.** Per integrazioni esterne con dipendenze (Pyva), usa sempre mock client come default in dev. Vera integrazione attivata via env var. Riduce blocker e accelera testing.

**6. Validazione manuale sempre.** I test E2E aiutano ma non sostituiscono il test umano. Apri il browser, prova davvero ogni flow come utente. È il momento in cui troverai i bug che gli automated test non catturano e capisci se la UX funziona davvero.

**7. Commit semantici e PR description.** Anche se sei solo, scrivi descrizioni di commit chiare. Quando il primo collaboratore arriverà, ti ringrazierà. E quando dovrai fare retrospettiva sul progetto, anche.

## 11. Note finali

Questo PRD è un documento vivente. Va aggiornato dopo:

- Ogni decisione di scope rilevante (feature aggiunte/rimosse)
- Validazione customer con i primi 50 utenti (re-prioritizzazione)
- Cambiamento del modello di pricing
- Espansione di una nuova verticale

Le decisioni prese in questo documento sono basate sull'analisi competitiva e di mercato del 30 aprile 2026 e sulla conoscenza dei founder del settore. Vanno riviste ogni trimestre rispetto ai dati reali raccolti.

***Il successo del progetto dipenderà più dall'esecuzione e dalla disciplina nel rimanere in scope MVP che dalla qualità di questo documento. Buon lavoro.***
