-- =============================================================================
-- [NOME_APP] — Batch B: Workspace core (storage bucket, activity log, realtime,
-- performance indexes).
--
-- Append-only rispetto a Batch A. Nessuna modifica retro a tabelle/policy
-- esistenti: questa migration aggiunge solo nuove entità e helper.
--
-- Aree:
--  1) Storage bucket "workspace-files" (privato, 100MB, mime list) + policy
--  2) Tabella public.workspace_activity_log + RLS
--  3) Helper private.log_workspace_activity + trigger su projects/milestones/files/messages
--  4) Aggiunta messages alla publication supabase_realtime
--  5) Indici aggiuntivi per dashboard stat aggregata
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Storage bucket "workspace-files"
-- Bucket privato, 100MB hard limit per file, allowed mime list ampia (immagini,
-- PDF, doc Office, archivi, testo). Path convention: {workspace_id}/{file_id}.
-- Le policy storage usano private.is_workspace_member/owner per coerenza con
-- le RLS della tabella public.files.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-files',
  'workspace-files',
  false,
  104857600, -- 100 MB
  array[
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip','application/x-zip-compressed','application/x-7z-compressed',
    'text/plain','text/csv','text/markdown',
    'application/json','application/xml',
    'video/mp4','video/quicktime','video/webm',
    'audio/mpeg','audio/mp4','audio/wav'
  ]
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- Policy storage: il primo segmento del path deve essere un workspace UUID
-- di cui l'utente è owner (insert/update/delete) o membro (select).
-- Nota: visibility=private è ulteriormente filtrato dalla RLS su public.files —
-- quello che ferma l'accesso a un file privato di un altro è la SELECT su files.
-- Lo storage policy resta defense-in-depth.
create policy "workspace_files_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and private.is_workspace_member(
      ((storage.foldername(name))[1])::uuid,
      (select auth.uid())
    )
  );

create policy "workspace_files_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-files'
    and private.is_workspace_owner(
      ((storage.foldername(name))[1])::uuid,
      (select auth.uid())
    )
  );

create policy "workspace_files_update_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and private.is_workspace_owner(
      ((storage.foldername(name))[1])::uuid,
      (select auth.uid())
    )
  )
  with check (
    bucket_id = 'workspace-files'
    and private.is_workspace_owner(
      ((storage.foldername(name))[1])::uuid,
      (select auth.uid())
    )
  );

create policy "workspace_files_delete_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'workspace-files'
    and private.is_workspace_owner(
      ((storage.foldername(name))[1])::uuid,
      (select auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- 2) Tabella public.workspace_activity_log
-- Stream cronologico di eventi nel workspace. Popolata via trigger DB su
-- projects/milestones/files/messages. Letta dal "Riepilogo attività" della
-- sidebar destra. INSERT/UPDATE/DELETE bloccati lato API — solo SELECT per i
-- membri. Le righe arrivano via SECURITY DEFINER trigger.
-- -----------------------------------------------------------------------------
create table public.workspace_activity_log (
  id uuid primary key default extensions.uuid_generate_v4(),
  workspace_id uuid not null references public.client_workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),

  constraint activity_log_event_type_check check (
    event_type in (
      'project_created','project_completed','project_archived',
      'milestone_created','milestone_in_progress','milestone_delivered','milestone_approved',
      'file_uploaded','file_deleted',
      'message_sent'
    )
  ),
  constraint activity_log_entity_type_check check (
    entity_type in ('project','milestone','file','message','workspace')
  )
);

create index workspace_activity_log_workspace_idx
  on public.workspace_activity_log(workspace_id, created_at desc);

create index workspace_activity_log_entity_idx
  on public.workspace_activity_log(entity_type, entity_id)
  where entity_id is not null;

alter table public.workspace_activity_log enable row level security;

create policy "activity_log_select_member"
  on public.workspace_activity_log for select
  to authenticated
  using (private.is_workspace_member(workspace_id, (select auth.uid())));

-- INSERT/UPDATE/DELETE: nessuna policy → solo trigger SECURITY DEFINER scrivono.

comment on table public.workspace_activity_log is
  'Stream cronologico eventi workspace. Popolato da trigger DB. SELECT-only via RLS.';

-- -----------------------------------------------------------------------------
-- 3) Helper private.log_workspace_activity + triggers
--
-- Il trigger su ogni tabella domain costruisce l'evento e chiama l'helper.
-- I trigger sono SECURITY DEFINER perché bypassano la RLS su workspace_activity_log
-- (che ha solo SELECT permessa).
-- -----------------------------------------------------------------------------
create or replace function private.log_workspace_activity(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_activity_log
    (workspace_id, actor_id, event_type, entity_type, entity_id, metadata)
  values
    (p_workspace_id, p_actor_id, p_event_type, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;
revoke all on function private.log_workspace_activity(uuid, uuid, text, text, uuid, jsonb) from public;

-- Trigger: projects ----------------------------------------------------------
create or replace function private.on_project_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if (tg_op = 'INSERT') then
    perform private.log_workspace_activity(
      new.workspace_id, v_actor, 'project_created', 'project', new.id,
      jsonb_build_object('title', new.title, 'type', new.type)
    );
  elsif (tg_op = 'UPDATE') then
    if (new.status = 'completed' and old.status is distinct from 'completed') then
      perform private.log_workspace_activity(
        new.workspace_id, v_actor, 'project_completed', 'project', new.id,
        jsonb_build_object('title', new.title)
      );
    elsif (new.status = 'archived' and old.status is distinct from 'archived') then
      perform private.log_workspace_activity(
        new.workspace_id, v_actor, 'project_archived', 'project', new.id,
        jsonb_build_object('title', new.title)
      );
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.on_project_change() from public;

create trigger projects_log_activity
  after insert or update on public.projects
  for each row execute function private.on_project_change();

-- Trigger: milestones --------------------------------------------------------
create or replace function private.on_milestone_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_workspace_id uuid;
begin
  -- Risolvi workspace_id dalla project_id corrente
  select p.workspace_id into v_workspace_id
  from public.projects p
  where p.id = coalesce(new.project_id, old.project_id);

  if v_workspace_id is null then
    return null; -- progetto già rimosso, niente da loggare
  end if;

  if (tg_op = 'INSERT') then
    perform private.log_workspace_activity(
      v_workspace_id, v_actor, 'milestone_created', 'milestone', new.id,
      jsonb_build_object('title', new.title, 'project_id', new.project_id)
    );
  elsif (tg_op = 'UPDATE') then
    if (new.status = 'in_progress' and old.status is distinct from 'in_progress') then
      perform private.log_workspace_activity(
        v_workspace_id, v_actor, 'milestone_in_progress', 'milestone', new.id,
        jsonb_build_object('title', new.title, 'project_id', new.project_id)
      );
    elsif (new.status = 'delivered' and old.status is distinct from 'delivered') then
      perform private.log_workspace_activity(
        v_workspace_id, v_actor, 'milestone_delivered', 'milestone', new.id,
        jsonb_build_object('title', new.title, 'project_id', new.project_id)
      );
    elsif (new.status = 'approved' and old.status is distinct from 'approved') then
      perform private.log_workspace_activity(
        v_workspace_id, v_actor, 'milestone_approved', 'milestone', new.id,
        jsonb_build_object('title', new.title, 'project_id', new.project_id)
      );
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.on_milestone_change() from public;

create trigger milestones_log_activity
  after insert or update on public.milestones
  for each row execute function private.on_milestone_change();

-- Trigger: files -------------------------------------------------------------
create or replace function private.on_file_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if (tg_op = 'INSERT') then
    perform private.log_workspace_activity(
      new.workspace_id, v_actor, 'file_uploaded', 'file', new.id,
      jsonb_build_object('filename', new.filename, 'visibility', new.visibility)
    );
  elsif (tg_op = 'UPDATE') then
    -- Soft delete: deleted_at impostato (NULL → NOT NULL)
    if (new.deleted_at is not null and old.deleted_at is null) then
      perform private.log_workspace_activity(
        new.workspace_id, v_actor, 'file_deleted', 'file', new.id,
        jsonb_build_object('filename', new.filename)
      );
    end if;
  end if;
  return null;
end;
$$;
revoke all on function private.on_file_change() from public;

create trigger files_log_activity
  after insert or update on public.files
  for each row execute function private.on_file_change();

-- Trigger: messages ----------------------------------------------------------
create or replace function private.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  perform private.log_workspace_activity(
    new.workspace_id, v_actor, 'message_sent', 'message', new.id,
    jsonb_build_object(
      'preview', left(new.body, 80),
      'project_id', new.project_id,
      'milestone_id', new.milestone_id
    )
  );
  return null;
end;
$$;
revoke all on function private.on_message_insert() from public;

create trigger messages_log_activity
  after insert on public.messages
  for each row execute function private.on_message_insert();

-- -----------------------------------------------------------------------------
-- 4) Realtime: aggiungi messages alla publication supabase_realtime
-- (le altre tabelle non necessitano realtime per ora)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 5) Indici aggiuntivi per dashboard stat aggregata
-- -----------------------------------------------------------------------------

-- "Incassato questo mese": filtra invoices per owner del workspace via join.
-- Aggiungi indice su paid_at desc per scan veloce delle paid recenti.
create index if not exists invoices_paid_at_idx
  on public.invoices(workspace_id, paid_at desc)
  where paid_at is not null;

-- "Fatture in attesa": status in ('issued','overdue'). Indice aggregato.
create index if not exists invoices_pending_idx
  on public.invoices(workspace_id)
  where status in ('issued','overdue');

-- Dashboard mostra workspace ordinati per "ultimo aggiornamento". Indice composito.
create index if not exists workspaces_last_activity_idx
  on public.client_workspaces(owner_id, updated_at desc);

-- =============================================================================
-- Done. Advisor atteso: solo auth_leaked_password_protection (toggle dashboard).
-- =============================================================================
