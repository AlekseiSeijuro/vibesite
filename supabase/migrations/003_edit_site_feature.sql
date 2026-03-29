-- ============================================================
-- VIBESITE — Миграция 003
-- Фича: чат-редактор правок сайта
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. Добавляем баланс правок в таблицу users
--    edit_balance — рублёвый баланс, списывается по 50 ₽ за правку
-- ============================================================
alter table public.users
  add column if not exists edit_balance integer not null default 0;

-- ============================================================
-- 2. Таблица edit_logs — лог каждой правки через чат
-- ============================================================
create table public.edit_logs (
  id            uuid primary key default uuid_generate_v4(),
  website_id    uuid not null references public.websites(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  user_message  text not null,               -- что попросил пользователь
  html_before   text,                        -- HTML до правки (для возможного отката)
  html_after    text,                        -- HTML после правки
  tokens_used   integer,                     -- токены, потраченные на запрос
  amount_charged integer not null default 50, -- списано рублей
  status        text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),
  error_message text,
  created_at    timestamptz not null default now()
);

create index idx_edit_logs_website_id on public.edit_logs(website_id);
create index idx_edit_logs_user_id    on public.edit_logs(user_id);
create index idx_edit_logs_status     on public.edit_logs(status);
create index idx_edit_logs_created_at on public.edit_logs(created_at desc);

-- ============================================================
-- 3. RLS для edit_logs
-- ============================================================
alter table public.edit_logs enable row level security;

create policy "Пользователь видит логи правок своих сайтов"
  on public.edit_logs for select
  using (auth.uid() = user_id);

create policy "Администратор видит все логи правок"
  on public.edit_logs for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- ГОТОВО.
-- Что добавлено:
--   • users.edit_balance  — рублёвый баланс на правки
--   • таблица edit_logs   — история правок с HTML до/после
-- ============================================================
