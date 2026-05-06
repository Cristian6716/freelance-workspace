-- =============================================================================
-- [NOME_APP] — Initial schema (Batch A)
-- 9 tabelle MVP per workspace freelance/cliente, progetti, file, messaggi,
-- fatture, template. RLS è abilitata in 00002. Trigger auth in 00003.
-- =============================================================================

-- Estensioni necessarie
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext"   with schema extensions;

-- -----------------------------------------------------------------------------
-- Helper: trigger generico per aggiornare updated_at su qualunque tabella.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Generic trigger: sets updated_at = now() before update. SECURITY INVOKER (no privilege escalation).';

-- -----------------------------------------------------------------------------
-- 1) profiles — un record per ogni utente registrato (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null,
  full_name text,
  vertical text,
  vat_number text,
  fiscal_regime text,
  iban text,
  logo_url text,
  brand_color text,
  pyva_connected boolean not null default false,
  pyva_api_key_encrypted text,
  fatture_in_cloud_token_encrypted text,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'active',
  stripe_customer_id text,
  has_seen_tour boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint profiles_vertical_check check (
    vertical is null or vertical in ('web_dev','architect','photographer','accountant','smm')
  ),
  constraint profiles_fiscal_regime_check check (
    fiscal_regime is null or fiscal_regime in ('forfettario','ordinario')
  ),
  constraint profiles_subscription_tier_check check (
    subscription_tier in ('free','pro','studio')
  ),
  constraint profiles_subscription_status_check check (
    subscription_status in ('active','trialing','past_due','canceled','incomplete')
  ),
  -- P.IVA italiana = 11 cifre. Validazione checksum applicata anche app-side.
  constraint profiles_vat_format_check check (
    vat_number is null or vat_number ~ '^[0-9]{11}$'
  ),
  -- IBAN IT = "IT" + 2 cifre + 1 lettera + 22 cifre = 27 caratteri. Validazione MOD-97 app-side.
  constraint profiles_iban_format_check check (
    iban is null or iban ~ '^IT[0-9]{2}[A-Z][0-9]{22}$'
  ),
  constraint profiles_brand_color_format_check check (
    brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

create index profiles_vertical_idx on public.profiles(vertical);
create index profiles_subscription_tier_idx on public.profiles(subscription_tier);
create index profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id) where stripe_customer_id is not null;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is 'Profilo utente freelance, 1:1 con auth.users. RLS in 00002.';
comment on column public.profiles.pyva_api_key_encrypted is
  'Token Pyva cifrato AES-256-GCM con ENCRYPTION_KEY env. Mai loggare in chiaro.';
comment on column public.profiles.vertical is
  'Verticale professionale scelto in onboarding. NULL fino al completamento step 1.';

-- -----------------------------------------------------------------------------
-- 2) client_workspaces — un workspace per ogni cliente del freelance
-- -----------------------------------------------------------------------------
create table public.client_workspaces (
  id uuid primary key default extensions.uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_name text not null,
  client_type text not null,
  client_email extensions.citext,
  client_phone text,
  client_vat text,
  client_sdi_code text,
  client_address jsonb,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint client_workspaces_client_type_check check (
    client_type in ('private','company','pa')
  ),
  constraint client_workspaces_status_check check (
    status in ('active','archived')
  ),
  constraint client_workspaces_client_vat_format_check check (
    client_vat is null or client_vat ~ '^[A-Z0-9]{8,16}$'
  )
);

create index client_workspaces_owner_idx   on public.client_workspaces(owner_id);
create index client_workspaces_status_idx  on public.client_workspaces(owner_id, status);
create index client_workspaces_created_idx on public.client_workspaces(owner_id, created_at desc);

create trigger client_workspaces_set_updated_at
  before update on public.client_workspaces
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3) workspace_members — partecipanti del workspace (owner freelance + client)
-- -----------------------------------------------------------------------------
create table public.workspace_members (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email extensions.citext not null,
  role text not null,
  invite_token uuid not null default extensions.uuid_generate_v4(),
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),

  constraint workspace_members_role_check check (
    role in ('owner','client')
  ),
  -- Owner role richiede user_id; client può essere ospite via magic link (user_id null OK).
  constraint workspace_members_owner_has_user_check check (
    role <> 'owner' or user_id is not null
  ),
  unique (workspace_id, email)
);

create unique index workspace_members_invite_token_idx on public.workspace_members(invite_token);
create index workspace_members_workspace_idx on public.workspace_members(workspace_id);
create index workspace_members_user_idx on public.workspace_members(user_id) where user_id is not null;

comment on column public.workspace_members.invite_token is
  'UUID magic-link token. Usato in /client/[token] per accesso ospite (Batch C).';

-- -----------------------------------------------------------------------------
-- 4) projects — progetti dentro un workspace (deliverable o ricorrente)
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  template_id uuid,  -- FK aggiunta dopo creazione tabella templates
  title text not null,
  description text,
  type text not null,
  status text not null default 'draft',
  start_date date,
  end_date date,
  recurring_period text,
  recurring_amount numeric(12,2),
  total_amount numeric(12,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint projects_type_check check (type in ('deliverable','recurring')),
  constraint projects_status_check check (status in ('draft','active','completed','archived')),
  constraint projects_recurring_period_check check (
    recurring_period is null or recurring_period in ('monthly','quarterly')
  ),
  constraint projects_recurring_consistency_check check (
    (type = 'recurring' and recurring_period is not null)
    or (type = 'deliverable' and recurring_period is null)
  ),
  constraint projects_amounts_nonneg_check check (
    (recurring_amount is null or recurring_amount >= 0)
    and (total_amount is null or total_amount >= 0)
  ),
  constraint projects_dates_order_check check (
    start_date is null or end_date is null or start_date <= end_date
  )
);

create index projects_workspace_idx on public.projects(workspace_id);
create index projects_status_idx on public.projects(workspace_id, status);
create index projects_template_idx on public.projects(template_id) where template_id is not null;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5) milestones — milestone all'interno di un progetto deliverable
-- -----------------------------------------------------------------------------
create table public.milestones (
  id uuid primary key default extensions.uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  due_date date,
  amount numeric(12,2),
  order_index integer not null default 0,
  notes_internal text,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint milestones_status_check check (
    status in ('todo','in_progress','delivered','approved')
  ),
  constraint milestones_amount_nonneg_check check (amount is null or amount >= 0)
);

create index milestones_project_idx on public.milestones(project_id, order_index);
create index milestones_status_idx on public.milestones(project_id, status);

create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6) files — file condivisi nel workspace (Supabase Storage backed)
-- -----------------------------------------------------------------------------
create table public.files (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  filename text not null,
  storage_path text not null unique,
  size_bytes bigint not null,
  mime_type text not null,
  visibility text not null default 'private',
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),

  constraint files_visibility_check check (visibility in ('private','shared')),
  constraint files_size_nonneg_check check (size_bytes >= 0),
  constraint files_size_max_check check (size_bytes <= 524288000) -- 500 MB hard ceiling DB-side
);

create index files_workspace_idx on public.files(workspace_id) where deleted_at is null;
create index files_project_idx on public.files(project_id) where project_id is not null and deleted_at is null;
create index files_visibility_idx on public.files(workspace_id, visibility) where deleted_at is null;
create index files_uploaded_by_idx on public.files(uploaded_by);

-- -----------------------------------------------------------------------------
-- 7) messages — chat workspace (cronologica)
-- -----------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  milestone_id uuid references public.milestones(id) on delete set null,
  sender_member_id uuid references public.workspace_members(id) on delete set null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),

  constraint messages_body_nonempty_check check (length(trim(body)) > 0)
);

create index messages_workspace_idx on public.messages(workspace_id, created_at desc);
create index messages_project_idx on public.messages(project_id, created_at desc) where project_id is not null;
create index messages_unread_idx on public.messages(workspace_id) where read_at is null;

-- -----------------------------------------------------------------------------
-- 8) invoices — tracking fatture (manuali + Pyva)
-- -----------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  milestone_id uuid references public.milestones(id) on delete set null,
  invoice_number text not null,
  issue_date date,
  due_date date,
  amount numeric(12,2) not null,
  status text not null default 'draft',
  source text not null default 'manual_pdf',
  external_id text,
  pdf_url text,
  xml_url text,
  payment_method text,
  payment_link text,
  silence_reminders boolean not null default false,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint invoices_status_check check (
    status in ('draft','issued','paid','overdue','cancelled')
  ),
  constraint invoices_source_check check (
    source in ('manual_pdf','pyva','fatture_in_cloud')
  ),
  constraint invoices_payment_method_check check (
    payment_method is null or payment_method in ('bank','stripe','paypal')
  ),
  constraint invoices_amount_nonneg_check check (amount >= 0),
  constraint invoices_dates_order_check check (
    issue_date is null or due_date is null or issue_date <= due_date
  ),
  unique (workspace_id, invoice_number)
);

create index invoices_workspace_idx on public.invoices(workspace_id);
create index invoices_status_idx on public.invoices(workspace_id, status);
create index invoices_due_idx on public.invoices(due_date) where status in ('issued','overdue');
create index invoices_external_id_idx on public.invoices(source, external_id) where external_id is not null;

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 9) templates — template di progetto preconfigurati per verticale
-- -----------------------------------------------------------------------------
create table public.templates (
  id uuid primary key default extensions.uuid_generate_v4(),
  vertical text not null,
  name text not null,
  description text,
  default_milestones jsonb not null default '[]'::jsonb,
  default_total_amount numeric(12,2),
  is_official boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),

  constraint templates_vertical_check check (
    vertical in ('web_dev','architect','photographer','accountant','smm')
  )
);

create index templates_vertical_idx on public.templates(vertical) where is_official = true;

-- FK ritardata su projects.template_id ora che templates esiste.
alter table public.projects
  add constraint projects_template_id_fkey
  foreign key (template_id) references public.templates(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Storage bucket: logo profilo freelance (Batch A onboarding)
-- Bucket privato, accesso via signed URL applicato lato app.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-logos',
  'profile-logos',
  false,
  2 * 1024 * 1024,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;
