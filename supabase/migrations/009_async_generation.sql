-- ============================================================
-- VIBESITE — Миграция 009
-- Добавление статуса 'generating' для асинхронной генерации
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- Расширяем CHECK constraint на поле status в таблице websites
alter table public.websites drop constraint if exists websites_status_check;
alter table public.websites
  add constraint websites_status_check
  check (status in ('draft', 'generating', 'demo', 'published', 'archived'));

-- ============================================================
-- ГОТОВО. Теперь websites.status может принимать значение 'generating'.
-- ============================================================
