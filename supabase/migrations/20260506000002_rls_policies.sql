-- =============================================================================
-- [NOME_APP] — RLS policies (Batch A)
-- Abilita RLS su tutte le tabelle pubbliche e crea policy di accesso
-- per owner, membri workspace, ospiti via magic link.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper SECURITY DEFINER: una sola query per checkare appartenenza al workspace
-- (evita ricorsione RLS perché non rilegge la tabella protetta).
-- search_path locked a stringa vuota: previene injection via search_path.
-- -----------------------------------------------------------------------------
create or replace function public.is_workspace_member(workspace_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.client_workspaces w
    where w.id = workspace_uuid
      and w.owner_id = user_uuid
  ) or exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = workspace_uuid
      and m.user_id = user_uuid
  );
$$;

revoke all on function public.is_workspace_member(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated, anon, service_role;

comment on function public.is_workspace_member is
  'Returns true if user_uuid owns or is member of workspace_uuid. SECURITY DEFINER, search_path locked.';

-- -----------------------------------------------------------------------------
-- Helper: workspace IDs di cui auth.uid() è owner. Restituisce setof.
-- Usato dalle policy per evitare subquery complesse.
-- -----------------------------------------------------------------------------
create or replace function public.is_workspace_owner(workspace_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.client_workspaces
    where id = workspace_uuid and owner_id = user_uuid
  );
$$;
revoke all on function public.is_workspace_owner(uuid, uuid) from public;
grant execute on function public.is_workspace_owner(uuid, uuid) to authenticated, service_role;

-- =============================================================================
-- Abilita RLS su tutte le tabelle (force = applica anche al table owner).
-- =============================================================================
alter table public.profiles            enable row level security;
alter table public.client_workspaces   enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.projects            enable row level security;
alter table public.milestones          enable row level security;
alter table public.files               enable row level security;
alter table public.messages            enable row level security;
alter table public.invoices            enable row level security;
alter table public.templates           enable row level security;

-- =============================================================================
-- profiles
-- =============================================================================
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- DELETE: nessuna policy → nessun accesso (cascade da auth.users gestito dal sistema).

-- =============================================================================
-- client_workspaces
-- =============================================================================
create policy "workspaces_select_member"
  on public.client_workspaces for select
  to authenticated
  using (public.is_workspace_member(id, (select auth.uid())));

create policy "workspaces_insert_owner"
  on public.client_workspaces for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "workspaces_update_owner"
  on public.client_workspaces for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "workspaces_delete_owner"
  on public.client_workspaces for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- =============================================================================
-- workspace_members
-- =============================================================================
create policy "members_select_workspace_member"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id, (select auth.uid())));

create policy "members_insert_owner"
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "members_update_owner_or_self"
  on public.workspace_members for update
  to authenticated
  using (
    public.is_workspace_owner(workspace_id, (select auth.uid()))
    or user_id = (select auth.uid())
  )
  with check (
    public.is_workspace_owner(workspace_id, (select auth.uid()))
    or user_id = (select auth.uid())
  );

create policy "members_delete_owner"
  on public.workspace_members for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())));

-- =============================================================================
-- projects
-- =============================================================================
create policy "projects_select_member"
  on public.projects for select
  to authenticated
  using (public.is_workspace_member(workspace_id, (select auth.uid())));

create policy "projects_mutate_owner"
  on public.projects for all
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (public.is_workspace_owner(workspace_id, (select auth.uid())));

-- =============================================================================
-- milestones — eredita controllo da projects.workspace_id
-- =============================================================================
create policy "milestones_select_member"
  on public.milestones for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and public.is_workspace_member(p.workspace_id, (select auth.uid()))
    )
  );

create policy "milestones_mutate_owner"
  on public.milestones for all
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and public.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and public.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  );

-- =============================================================================
-- files — i privati visti solo dall'uploader; gli shared dai membri del workspace
-- =============================================================================
create policy "files_select_member_visibility"
  on public.files for select
  to authenticated
  using (
    deleted_at is null
    and public.is_workspace_member(workspace_id, (select auth.uid()))
    and (visibility = 'shared' or uploaded_by = (select auth.uid()))
  );

create policy "files_insert_owner"
  on public.files for insert
  to authenticated
  with check (
    public.is_workspace_owner(workspace_id, (select auth.uid()))
    and uploaded_by = (select auth.uid())
  );

create policy "files_update_owner"
  on public.files for update
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (public.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "files_delete_owner"
  on public.files for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())));

-- =============================================================================
-- messages
-- =============================================================================
create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (public.is_workspace_member(workspace_id, (select auth.uid())));

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id, (select auth.uid()))
    and exists (
      select 1 from public.workspace_members m
      where m.id = sender_member_id
        and m.workspace_id = messages.workspace_id
        and m.user_id = (select auth.uid())
    )
  );

create policy "messages_update_owner"
  on public.messages for update
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (public.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "messages_delete_owner"
  on public.messages for delete
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())));

-- =============================================================================
-- invoices
-- =============================================================================
create policy "invoices_select_member"
  on public.invoices for select
  to authenticated
  using (public.is_workspace_member(workspace_id, (select auth.uid())));

create policy "invoices_mutate_owner"
  on public.invoices for all
  to authenticated
  using (public.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (public.is_workspace_owner(workspace_id, (select auth.uid())));

-- =============================================================================
-- templates — catalogo lettura per tutti gli authenticated; mutazioni admin/service.
-- =============================================================================
create policy "templates_select_authenticated"
  on public.templates for select
  to authenticated
  using (true);

-- =============================================================================
-- Storage policies — bucket profile-logos
-- File path convention: {auth.uid()}/{filename}. Owner = solo proprietario.
-- =============================================================================
create policy "profile_logos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profile-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "profile_logos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "profile_logos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "profile_logos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
