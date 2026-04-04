-- ============================================================
-- VIBESITE — Миграция 004
-- Фича: чат поддержки пользователей с администратором
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. Таблица support_chats — один чат на пользователя
-- ============================================================
create table public.support_chats (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  status            text not null default 'open'
    check (status in ('open', 'closed')),
  unread_by_admin   integer not null default 0,  -- непрочитанных у админа
  unread_by_user    integer not null default 0,  -- непрочитанных у пользователя
  last_message_at   timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id)  -- один чат на пользователя
);

create index idx_support_chats_user_id        on public.support_chats(user_id);
create index idx_support_chats_last_message   on public.support_chats(last_message_at desc nulls last);
create index idx_support_chats_unread_admin   on public.support_chats(unread_by_admin) where unread_by_admin > 0;

-- ============================================================
-- 2. Таблица support_messages — сообщения в чате
-- ============================================================
create table public.support_messages (
  id          uuid primary key default uuid_generate_v4(),
  chat_id     uuid not null references public.support_chats(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index idx_support_messages_chat_id    on public.support_messages(chat_id);
create index idx_support_messages_created_at on public.support_messages(created_at asc);

-- ============================================================
-- 3. RLS для support_chats
-- ============================================================
alter table public.support_chats enable row level security;

-- Пользователь видит только свой чат
create policy "Пользователь видит свой чат"
  on public.support_chats for select
  using (auth.uid() = user_id);

-- Пользователь может создать чат для себя
create policy "Пользователь создаёт свой чат"
  on public.support_chats for insert
  with check (auth.uid() = user_id);

-- Пользователь может обновлять только свой чат (сброс unread_by_user)
create policy "Пользователь обновляет свой чат"
  on public.support_chats for update
  using (auth.uid() = user_id);

-- Администратор видит и управляет всеми чатами
create policy "Администратор управляет всеми чатами"
  on public.support_chats for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- 4. RLS для support_messages
-- ============================================================
alter table public.support_messages enable row level security;

-- Пользователь видит сообщения только своего чата
create policy "Пользователь видит сообщения своего чата"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_chats c
      where c.id = support_messages.chat_id and c.user_id = auth.uid()
    )
  );

-- Пользователь может писать только в свой чат
create policy "Пользователь пишет в свой чат"
  on public.support_messages for insert
  with check (
    exists (
      select 1 from public.support_chats c
      where c.id = support_messages.chat_id and c.user_id = auth.uid()
    )
    and sender_role = 'user'
  );

-- Администратор видит и пишет во все чаты
create policy "Администратор управляет всеми сообщениями"
  on public.support_messages for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- ГОТОВО.
-- Что добавлено:
--   • support_chats    — один чат на пользователя, счётчики непрочитанных
--   • support_messages — сообщения с ролью отправителя (user / admin)
-- ============================================================
