-- 010_analytics_events.sql
-- Таблица для продуктовой аналитики Vibesite

create table analytics_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references users(id) on delete set null,
  event_name  text        not null,
  properties  jsonb       not null default '{}',
  session_id  text,
  created_at  timestamptz not null default now()
);

-- Индексы для быстрых выборок в дашборде аналитики
create index on analytics_events (event_name, created_at desc);
create index on analytics_events (user_id,    created_at desc);
create index on analytics_events (created_at desc);

-- RLS
alter table analytics_events enable row level security;

-- Авторизованные пользователи пишут только свои события,
-- анонимные (user_id = null) тоже могут писать
create policy "insert own events" on analytics_events
  for insert with check (auth.uid() = user_id or user_id is null);

-- Только администраторы читают все события
create policy "admin read all" on analytics_events
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
