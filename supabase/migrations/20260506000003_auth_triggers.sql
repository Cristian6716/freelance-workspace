-- =============================================================================
-- [NOME_APP] — Auth triggers (Batch A)
-- handle_new_user: crea automaticamente un profilo quando arriva un nuovo
-- auth.users (signup email/password o OAuth).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Idempotente: se per qualsiasi motivo il profilo esiste già, non sovrascrive.
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

revoke all on function public.handle_new_user() from public;

comment on function public.handle_new_user is
  'Trigger: crea profiles row quando si registra un auth.users. SECURITY DEFINER per bypass RLS.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
