-- ============================================================
-- VIBESITE — Миграция 008
-- Синхронизация role в auth.users.raw_app_meta_data
-- Без этого RLS-политики на основе auth.jwt() не видят role = admin
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. Функция синхронизации role в app_metadata
--    Срабатывает при UPDATE на public.users
--    Записывает role в auth.users.raw_app_meta_data
-- ============================================================
create or replace function public.sync_role_to_auth()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Обновляем raw_app_meta_data в auth.users при изменении role
  if new.role is distinct from old.role then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
    where id = new.id;
  end if;
  return new;
end;
$$;

-- Триггер на UPDATE таблицы users
drop trigger if exists on_user_role_changed on public.users;
create trigger on_user_role_changed
  after update of role on public.users
  for each row execute procedure public.sync_role_to_auth();

-- ============================================================
-- 2. Одноразовая синхронизация — обновить всех существующих
--    админов, у которых role ещё не в app_metadata
-- ============================================================
update auth.users au
set raw_app_meta_data = coalesce(au.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', pu.role)
from public.users pu
where au.id = pu.id
  and pu.role = 'admin'
  and (au.raw_app_meta_data ->> 'role') is distinct from 'admin';

-- ============================================================
-- ГОТОВО.
-- Теперь при изменении role в public.users через Table Editor
-- или через API — role автоматически синхронизируется в
-- auth.users.raw_app_meta_data, и RLS-политики на основе
-- auth.jwt() -> 'app_metadata' ->> 'role' будут работать.
-- ============================================================
