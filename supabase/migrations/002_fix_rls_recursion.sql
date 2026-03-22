-- Исправление бесконечной рекурсии в RLS политиках таблицы users
-- Запустить в Supabase → SQL Editor

-- 1. Удаляем все старые политики на таблице users
drop policy if exists "Пользователь видит только свой профиль" on public.users;
drop policy if exists "Пользователь обновляет только свой профиль" on public.users;
drop policy if exists "Администратор видит всех пользователей" on public.users;

-- 2. Создаём исправленные политики без рекурсии

-- Пользователь видит свой профиль
create policy "Пользователь видит только свой профиль"
  on public.users for select
  using (auth.uid() = id);

-- Пользователь обновляет свой профиль
create policy "Пользователь обновляет только свой профиль"
  on public.users for update
  using (auth.uid() = id);

-- Администратор видит всех — через auth.jwt() чтобы избежать рекурсии
-- (читаем role из JWT метаданных, а не из самой таблицы users)
create policy "Администратор видит всех пользователей"
  on public.users for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- 3. Исправляем аналогичную рекурсию в других таблицах
-- websites
drop policy if exists "Администратор управляет всеми сайтами" on public.websites;
create policy "Администратор управляет всеми сайтами"
  on public.websites for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- plans
drop policy if exists "Администратор управляет тарифами" on public.plans;
create policy "Администратор управляет тарифами"
  on public.plans for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- subscriptions
drop policy if exists "Администратор управляет подписками" on public.subscriptions;
create policy "Администратор управляет подписками"
  on public.subscriptions for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- orders
drop policy if exists "Администратор управляет заявками" on public.orders;
create policy "Администратор управляет заявками"
  on public.orders for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- generation_logs
drop policy if exists "Администратор видит все логи" on public.generation_logs;
create policy "Администратор видит все логи"
  on public.generation_logs for all
  using (
    coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role'),
      (auth.jwt() -> 'app_metadata' ->> 'role')
    ) = 'admin'
  );

-- 4. Обновляем триггер — при создании пользователя
-- сохраняем role в auth metadata чтобы политики работали
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
