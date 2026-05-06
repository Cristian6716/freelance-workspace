-- =============================================================================
-- [NOME_APP] — messages: aggiungi sender_profile_id per messaggi inviati
-- dall'owner del workspace.
--
-- Razionale: nella nuova convenzione "no member-row per l'owner" (vedi
-- migration 20260506115034), gli owner non hanno una riga in workspace_members.
-- Il campo sender_member_id (FK a workspace_members) non era quindi
-- compilabile da loro, e la policy messages_insert_member li bloccava.
--
-- Soluzione: aggiungiamo sender_profile_id (FK profiles) e una check che
-- vincola "exactly one of sender_profile_id / sender_member_id is not null"
-- (più la possibilità di entrambi null per messaggi di sistema futuri).
-- La policy INSERT viene aggiornata per accettare entrambi i path:
--   - sender_profile_id = auth.uid() AND il chiamante è owner del workspace
--   - sender_member_id punta a una row workspace_members con user_id = auth.uid()
-- =============================================================================

alter table public.messages
  add column if not exists sender_profile_id uuid
  references public.profiles(id) on delete set null;

create index if not exists messages_sender_profile_idx
  on public.messages(sender_profile_id) where sender_profile_id is not null;

-- "Esattamente uno (al massimo)": owner-message OR member-message OR system.
alter table public.messages
  drop constraint if exists messages_sender_exactly_one_check;

alter table public.messages
  add constraint messages_sender_exactly_one_check check (
    (sender_profile_id is not null and sender_member_id is null) or
    (sender_profile_id is null and sender_member_id is not null) or
    (sender_profile_id is null and sender_member_id is null)
  );

-- Aggiornamento policy INSERT per supportare owner via sender_profile_id.
drop policy if exists "messages_insert_member" on public.messages;

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    private.is_workspace_member(workspace_id, (select auth.uid()))
    and (
      -- Path A: messaggio inviato dall'OWNER del workspace via profile id
      (
        sender_profile_id = (select auth.uid())
        and exists (
          select 1 from public.client_workspaces w
          where w.id = messages.workspace_id
            and w.owner_id = (select auth.uid())
        )
      )
      or
      -- Path B: messaggio inviato da un MEMBER (cliente invitato) via member id
      (
        exists (
          select 1 from public.workspace_members m
          where m.id = sender_member_id
            and m.workspace_id = messages.workspace_id
            and m.user_id = (select auth.uid())
        )
      )
    )
  );

comment on policy "messages_insert_member" on public.messages is
  'Owner via sender_profile_id (no member-row), member via sender_member_id.';
