-- ============================================================
-- VIBESITE — SQL миграция
-- Запускать в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. РАСШИРЕНИЯ
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. ТАБЛИЦА users (расширяет auth.users)
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'expired')),
  subscription_ends_at timestamptz null,
  created_at timestamptz not null default now()
);

-- Триггер: при регистрации нового пользователя — создать запись в public.users
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. ТАБЛИЦА websites
-- ============================================================
create table public.websites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  subdomain text unique,
  custom_domain text unique,
  status text not null default 'draft'
    check (status in ('draft', 'demo', 'published', 'archived')),
  generated_code text,
  prompt_used text,
  meta_data jsonb,
  data_hash text,
  subscription_plan text
    check (subscription_plan in ('demo', 'subdomain', 'custom_domain')),
  is_source_code_provided boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index idx_websites_user_id on public.websites(user_id);
create index idx_websites_subdomain on public.websites(subdomain);
create index idx_websites_status on public.websites(status);

-- ============================================================
-- 4. ТАБЛИЦА photos
-- ============================================================
create table public.photos (
  id uuid primary key default uuid_generate_v4(),
  website_id uuid not null references public.websites(id) on delete cascade,
  s3_url text not null,
  order_index integer not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_photos_website_id on public.photos(website_id);

-- ============================================================
-- 5. ТАБЛИЦА plans (тарифы, управляются из админки)
-- ============================================================
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique check (slug in ('demo', 'subdomain', 'custom_domain')),
  price_monthly integer null,      -- в рублях, null если не применимо
  price_yearly integer null,
  price_onetime integer null,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Начальные данные тарифов
insert into public.plans (name, slug, price_monthly, price_yearly, price_onetime, features) values
  ('Демо', 'demo', null, null, null,
   '["Поддомен с водяным знаком", "1 страница", "До 3 генераций в сутки", "Неограниченное количество правок"]'),
  ('Поддомен', 'subdomain', 700, 6000, null,
   '["Свой поддомен без водяного знака", "До 5 страниц", "Неограниченные генерации", "Редактирование через кабинет"]'),
  ('Свой домен + исходники', 'custom_domain', null, null, 3500,
   '["Подключение своего домена", "Передача исходных файлов", "Инструкция по размещению", "Помощь менеджера"]');

-- ============================================================
-- 6. ТАБЛИЦА subscriptions
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  plan text not null check (plan in ('demo', 'subdomain', 'custom_domain')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  amount integer not null default 0,
  payment_id text,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_website_id on public.subscriptions(website_id);

-- ============================================================
-- 7. ТАБЛИЦА orders (заявки на «Свой домен + исходники»)
-- ============================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);

-- ============================================================
-- 8. ТАБЛИЦА generation_logs (логи каждой генерации)
-- ============================================================
create table public.generation_logs (
  id uuid primary key default uuid_generate_v4(),
  website_id uuid not null references public.websites(id) on delete cascade,
  prompt_used text not null,
  raw_response text,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),
  attempt_number integer not null default 1,
  tokens_used integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_generation_logs_website_id on public.generation_logs(website_id);
create index idx_generation_logs_status on public.generation_logs(status);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- users
alter table public.users enable row level security;

create policy "Пользователь видит только свой профиль"
  on public.users for select
  using (auth.uid() = id);

create policy "Пользователь обновляет только свой профиль"
  on public.users for update
  using (auth.uid() = id);

create policy "Администратор видит всех пользователей"
  on public.users for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- websites
alter table public.websites enable row level security;

create policy "Пользователь управляет своими сайтами"
  on public.websites for all
  using (auth.uid() = user_id);

create policy "Публичный просмотр опубликованных сайтов"
  on public.websites for select
  using (status = 'published');

create policy "Администратор управляет всеми сайтами"
  on public.websites for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- photos
alter table public.photos enable row level security;

create policy "Пользователь управляет своими фото"
  on public.photos for all
  using (
    exists (
      select 1 from public.websites w
      where w.id = photos.website_id and w.user_id = auth.uid()
    )
  );

-- plans (публичное чтение)
alter table public.plans enable row level security;

create policy "Все могут читать активные тарифы"
  on public.plans for select
  using (is_active = true);

create policy "Администратор управляет тарифами"
  on public.plans for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- subscriptions
alter table public.subscriptions enable row level security;

create policy "Пользователь видит свои подписки"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Администратор управляет подписками"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- orders
alter table public.orders enable row level security;

create policy "Пользователь видит свои заявки"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Пользователь создаёт заявки"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Администратор управляет заявками"
  on public.orders for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- generation_logs
alter table public.generation_logs enable row level security;

create policy "Пользователь видит логи своих сайтов"
  on public.generation_logs for select
  using (
    exists (
      select 1 from public.websites w
      where w.id = generation_logs.website_id and w.user_id = auth.uid()
    )
  );

create policy "Администратор видит все логи"
  on public.generation_logs for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================
-- ГОТОВО. Все таблицы, индексы, политики и начальные данные созданы.
-- ============================================================
