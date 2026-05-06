-- =============================================================================
-- [NOME_APP] — Harden helper functions & split mutation policies (Batch A)
-- Risolve i warning di db advisor:
--   • 0028/0029 SECURITY DEFINER esposto via REST RPC
--   • 0006   multiple_permissive_policies su projects/milestones/invoices
-- Strategia:
--   1. Creiamo schema "private" non esposto da PostgREST.
--   2. Spostiamo helper SECURITY DEFINER (is_workspace_member, is_workspace_owner)
--      in private. Le policy continueranno a chiamarle perché authenticated ha
--      USAGE+EXECUTE sui simboli dello schema private, ma /rest/v1/rpc/* non
--      espone funzioni fuori da public.
--   3. Spostiamo handle_new_user in private — il trigger invoca cross-schema OK.
--   4. Splittiamo le policy _mutate_owner (FOR ALL) in INSERT/UPDATE/DELETE,
--      così la SELECT è gestita da una sola policy permissiva.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Schema "private" — non esposto via PostgREST (config db.schemas = public)
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2) Recreazione helpers in private
-- -----------------------------------------------------------------------------
create or replace function private.is_workspace_member(workspace_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.client_workspaces w
    where w.id = workspace_uuid and w.owner_id = user_uuid
  ) or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = workspace_uuid and m.user_id = user_uuid
  );
$$;
revoke all on function private.is_workspace_member(uuid, uuid) from public;
grant execute on function private.is_workspace_member(uuid, uuid) to authenticated, service_role;

create or replace function private.is_workspace_owner(workspace_uuid uuid, user_uuid uuid)
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
revoke all on function private.is_workspace_owner(uuid, uuid) from public;
grant execute on function private.is_workspace_owner(uuid, uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3) handle_new_user in private + trigger ricostruito
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4) Drop & recreate policies che usavano public.is_workspace_*
--    Le ricreiamo riferendo private.* e splittiamo _mutate_owner in 3 policy.
-- -----------------------------------------------------------------------------

-- client_workspaces
drop policy if exists "workspaces_select_member"  on public.client_workspaces;
drop policy if exists "workspaces_insert_owner"   on public.client_workspaces;
drop policy if exists "workspaces_update_owner"   on public.client_workspaces;
drop policy if exists "workspaces_delete_owner"   on public.client_workspaces;

create policy "workspaces_select_member"
  on public.client_workspaces for select
  to authenticated
  using (private.is_workspace_member(id, (select auth.uid())));

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

-- workspace_members
drop policy if exists "members_select_workspace_member" on public.workspace_members;
drop policy if exists "members_insert_owner"            on public.workspace_members;
drop policy if exists "members_update_owner_or_self"    on public.workspace_members;
drop policy if exists "members_delete_owner"            on public.workspace_members;

create policy "members_select_workspace_member"
  on public.workspace_members for select
  to authenticated
  using (private.is_workspace_member(workspace_id, (select auth.uid())));

create policy "members_insert_owner"
  on public.workspace_members for insert
  to authenticated
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "members_update_owner_or_self"
  on public.workspace_members for update
  to authenticated
  using (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
    or user_id = (select auth.uid())
  )
  with check (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
    or user_id = (select auth.uid())
  );

create policy "members_delete_owner"
  on public.workspace_members for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())));

-- projects (split mutate)
drop policy if exists "projects_select_member"   on public.projects;
drop policy if exists "projects_mutate_owner"    on public.projects;

create policy "projects_select_member"
  on public.projects for select
  to authenticated
  using (private.is_workspace_member(workspace_id, (select auth.uid())));

create policy "projects_insert_owner"
  on public.projects for insert
  to authenticated
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "projects_update_owner"
  on public.projects for update
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "projects_delete_owner"
  on public.projects for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())));

-- milestones (split mutate)
drop policy if exists "milestones_select_member"   on public.milestones;
drop policy if exists "milestones_mutate_owner"    on public.milestones;

create policy "milestones_select_member"
  on public.milestones for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and private.is_workspace_member(p.workspace_id, (select auth.uid()))
    )
  );

create policy "milestones_insert_owner"
  on public.milestones for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and private.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  );

create policy "milestones_update_owner"
  on public.milestones for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and private.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and private.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  );

create policy "milestones_delete_owner"
  on public.milestones for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and private.is_workspace_owner(p.workspace_id, (select auth.uid()))
    )
  );

-- files
drop policy if exists "files_select_member_visibility" on public.files;
drop policy if exists "files_insert_owner"             on public.files;
drop policy if exists "files_update_owner"             on public.files;
drop policy if exists "files_delete_owner"             on public.files;

create policy "files_select_member_visibility"
  on public.files for select
  to authenticated
  using (
    deleted_at is null
    and private.is_workspace_member(workspace_id, (select auth.uid()))
    and (visibility = 'shared' or uploaded_by = (select auth.uid()))
  );

create policy "files_insert_owner"
  on public.files for insert
  to authenticated
  with check (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
    and uploaded_by = (select auth.uid())
  );

create policy "files_update_owner"
  on public.files for update
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "files_delete_owner"
  on public.files for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())));

-- messages
drop policy if exists "messages_select_member"  on public.messages;
drop policy if exists "messages_insert_member"  on public.messages;
drop policy if exists "messages_update_owner"   on public.messages;
drop policy if exists "messages_delete_owner"   on public.messages;

create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (private.is_workspace_member(workspace_id, (select auth.uid())));

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    private.is_workspace_member(workspace_id, (select auth.uid()))
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
  using (private.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "messages_delete_owner"
  on public.messages for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())));

-- invoices (split mutate)
drop policy if exists "invoices_select_member"   on public.invoices;
drop policy if exists "invoices_mutate_owner"    on public.invoices;

create policy "invoices_select_member"
  on public.invoices for select
  to authenticated
  using (private.is_workspace_member(workspace_id, (select auth.uid())));

create policy "invoices_insert_owner"
  on public.invoices for insert
  to authenticated
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "invoices_update_owner"
  on public.invoices for update
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())))
  with check (private.is_workspace_owner(workspace_id, (select auth.uid())));

create policy "invoices_delete_owner"
  on public.invoices for delete
  to authenticated
  using (private.is_workspace_owner(workspace_id, (select auth.uid())));

-- -----------------------------------------------------------------------------
-- 5) Drop helper pubblici e handle_new_user pubblico ora che nessuno li usa
-- -----------------------------------------------------------------------------
drop function if exists public.is_workspace_member(uuid, uuid);
drop function if exists public.is_workspace_owner(uuid, uuid);
drop function if exists public.handle_new_user();

-- =============================================================================
-- Done. Tutti i warning advisor su SECURITY DEFINER e multiple_permissive_policies
-- dovrebbero essere risolti.
-- =============================================================================
