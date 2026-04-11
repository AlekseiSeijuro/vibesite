-- ============================================================
-- VIBESITE — Миграция 007
-- 1. Атомарное списание баланса (fix race condition)
-- 2. Добавление INSERT-политик для generation_logs и edit_logs
-- 3. Создание функции increment_unread (была пропущена)
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. Функция атомарного списания баланса
--    Возвращает новый баланс или -1 если недостаточно средств
-- ============================================================
create or replace function public.deduct_edit_balance(
  p_user_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance integer;
begin
  update public.users
  set edit_balance = edit_balance - p_amount
  where id = p_user_id
    and edit_balance >= p_amount
  returning edit_balance into v_new_balance;

  if not found then
    return -1;
  end if;

  return v_new_balance;
end;
$$;

-- ============================================================
-- 2. Функция атомарного пополнения баланса
--    Возвращает новый баланс
-- ============================================================
create or replace function public.topup_edit_balance(
  p_user_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance integer;
begin
  update public.users
  set edit_balance = edit_balance + p_amount
  where id = p_user_id
  returning edit_balance into v_new_balance;

  return coalesce(v_new_balance, -1);
end;
$$;

-- ============================================================
-- 3. Функция increment_unread (была пропущена в миграции 004)
-- ============================================================
create or replace function public.increment_unread(
  p_chat_id uuid,
  p_field text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_field = 'unread_by_admin' then
    update public.support_chats
    set unread_by_admin = unread_by_admin + 1
    where id = p_chat_id;
  elsif p_field = 'unread_by_user' then
    update public.support_chats
    set unread_by_user = unread_by_user + 1
    where id = p_chat_id;
  end if;
end;
$$;

-- ============================================================
-- 4. INSERT-политики для generation_logs
--    Пользователь может вставлять логи для своих сайтов
-- ============================================================
create policy "Пользователь вставляет логи своих сайтов"
  on public.generation_logs for insert
  with check (
    exists (
      select 1 from public.websites w
      where w.id = generation_logs.website_id and w.user_id = auth.uid()
    )
  );

-- Пользователь может обновлять логи своих сайтов (для update статуса)
create policy "Пользователь обновляет логи своих сайтов"
  on public.generation_logs for update
  using (
    exists (
      select 1 from public.websites w
      where w.id = generation_logs.website_id and w.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. INSERT и UPDATE политики для edit_logs
--    Пользователь может вставлять и обновлять логи правок
-- ============================================================
create policy "Пользователь вставляет логи правок"
  on public.edit_logs for insert
  with check (auth.uid() = user_id);

create policy "Пользователь обновляет свои логи правок"
  on public.edit_logs for update
  using (auth.uid() = user_id);

-- ============================================================
-- ГОТОВО.
-- Что добавлено:
--   • deduct_edit_balance()  — атомарное списание с проверкой
--   • topup_edit_balance()   — атомарное пополнение
--   • increment_unread()     — была пропущена ранее
--   • INSERT/UPDATE RLS для generation_logs и edit_logs
-- ============================================================
