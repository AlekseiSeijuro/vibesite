-- ============================================================
-- VIBESITE — Миграция 006
-- Добавляем колонку type в subscriptions для различия платежей
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

alter table public.subscriptions
  add column if not exists type text not null default 'subscription'
    check (type in ('subscription', 'balance_topup'));

-- Обновляем существующие записи
update public.subscriptions set type = 'subscription' where type is null;

-- ============================================================
-- ГОТОВО.
-- ============================================================
