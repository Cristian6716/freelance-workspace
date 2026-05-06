-- =============================================================================
-- [NOME_APP] — Fix: client_workspaces SELECT policy — supporto INSERT...RETURNING
--
-- Bug latente da Batch A: insert + .select() (RETURNING) sul Supabase JS client
-- produceva sempre 42501 perché la SELECT policy "workspaces_select_member"
-- chiamava private.is_workspace_member(id, auth.uid()), che è STABLE e fa
-- una SELECT su public.client_workspaces. Dentro la stessa statement INSERT,
-- la funzione STABLE non vedeva la riga appena inserita (la sua snapshot è
-- presa all'inizio della statement, prima dell'INSERT).
--
-- Fix: la SELECT policy di client_workspaces ora valuta direttamente le colonne
-- della riga (owner_id = auth.uid()) e fa una EXISTS subquery inline su
-- workspace_members. Postgres risolve owner_id contro la NEW row del RETURNING,
-- senza passare da una funzione che ha la propria snapshot.
--
-- Le altre policy che usano is_workspace_member NON hanno questo problema:
-- riguardano tabelle figlie (projects, files, ecc.) il cui workspace_id punta
-- a una riga di client_workspaces inserita PRIMA — quindi visibile alla
-- snapshot della funzione STABLE.
-- =============================================================================

drop policy if exists "workspaces_select_member" on public.client_workspaces;

create policy "workspaces_select_member"
  on public.client_workspaces for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_members m
      where m.workspace_id = client_workspaces.id
        and m.user_id = (select auth.uid())
    )
  );

comment on policy "workspaces_select_member" on public.client_workspaces is
  'Owner via colonna diretta (compatibile con RETURNING di INSERT) + member via subquery inline.';
