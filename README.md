# Vibesite — AI-генератор сайтов для бьюти-мастеров

SaaS-сервис для автоматического создания сайтов-визиток для мастеров и салонов красоты. Пользователь заполняет анкету (ниша, услуги, контакты, фото), система формирует промпт и через Claude AI генерирует готовый HTML/CSS сайт.

**Продакшн:** [beauty-site.ru](https://beauty-site.ru) · Репозиторий: `AlekseiSeijuro/vibesite`

---

## Стек

| Параметр | Значение |
|---|---|
| Frontend / Backend | Next.js 14 (App Router) + TypeScript |
| База данных | Supabase (PostgreSQL + Auth + RLS) |
| Хранилище файлов | Yandex Cloud Object Storage (S3) |
| AI генерация | RouterAI → Claude Sonnet (anthropic/claude-sonnet-4-5) |
| Платежи | ЮKassa (боевой магазин) |
| Хостинг | Vercel + VPS Selectel (Nginx прокси) |
| Стили | Tailwind CSS |
| Тестирование | Vitest + Testing Library |
| Управление состоянием | Zustand |
| Валидация форм | React Hook Form + Zod |
| Уведомления | Sonner |
| Иконки | Lucide React |
| Аналитика | Яндекс.Метрика + Supabase analytics_events |

---

## Быстрый старт (локально)

### 1. Установка зависимостей

```bash
cd vibesite
npm install
```

### 2. Переменные окружения

```bash
copy .env.local.example .env.local
```

Минимум для запуска:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ROUTERAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=vibesite.ru
NEXT_PUBLIC_YM_ID=                        # номер счётчика Яндекс.Метрики
```

### 3. База данных

Открой Supabase → Dashboard → SQL Editor и выполни миграции по порядку:

```
001_initial_schema.sql          — таблицы, RLS, триггеры
002_fix_rls_recursion.sql       — исправление политик
003_edit_site_feature.sql       — AI-редактор сайта
004_support_chat.sql            — чат поддержки
005_remove_subscription_website_id.sql
006_subscriptions_type.sql
007_atomic_balance_and_rls_fixes.sql
008_sync_role_to_auth_metadata.sql
009_async_generation.sql        — асинхронная генерация через worker
010_analytics_events.sql        — таблица аналитики
```

### 4. Запуск

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## Структура проекта

```
src/
├── app/
│   ├── (auth)/              # Страницы входа/регистрации
│   ├── auth/                # OAuth callback
│   ├── dashboard/
│   │   ├── create/          # Мастер создания сайта (6 шагов)
│   │   ├── preview/[id]/    # Предпросмотр и публикация
│   │   ├── billing/         # Подписка и платежи
│   │   ├── support/         # Чат поддержки
│   │   └── settings/        # Настройки аккаунта
│   ├── admin/
│   │   ├── page.tsx         # Пользователи
│   │   ├── analytics/       # Дашборд аналитики ← новое
│   │   ├── sites/           # Управление сайтами
│   │   ├── orders/          # Заявки на свой домен
│   │   ├── support/         # Чаты поддержки
│   │   └── logs/            # Логи генерации
│   └── api/
│       ├── generate-site/   # Генерация HTML через RouterAI
│       ├── publish-site/    # Публикация сайта
│       ├── edit-site/       # AI-правки сайта
│       ├── upload-photo/    # Загрузка фото в S3
│       ├── payments/        # ЮKassa: платёж и webhook
│       ├── preview/[id]/    # Превью для iframe
│       ├── site/[subdomain] # Отдача клиентских сайтов
│       └── support/         # API чата поддержки
├── components/
│   ├── create/              # Шаги формы Step1–Step6
│   ├── dashboard/           # Навигация, кнопки оплаты
│   ├── ui/                  # Input, Button
│   └── YandexMetrika.tsx    # Скрипт счётчика ← новое
├── lib/
│   ├── supabase/            # Клиенты browser/server
│   ├── yookassa/            # ЮKassa клиент и тарифы
│   ├── validation/          # Zod схемы
│   ├── analytics.ts         # Хелпер track() ← новое
│   ├── promptBuilder.ts     # Построение промпта
│   ├── promptSafety.ts      # Защита от prompt injection
│   ├── htmlUtils.ts         # Обработка HTML
│   ├── s3.ts                # Yandex Cloud S3
│   └── utils.ts             # Утилиты
├── store/
│   └── createSiteStore.ts   # Zustand стор формы
├── types/
│   └── index.ts             # TypeScript типы
└── middleware.ts             # Защита роутов + поддомены
```

---

## Аналитика

### Архитектура

События дублируются в два места одновременно:
- **Яндекс.Метрика** — поведение на сайте, Вебвизор, воронки
- **Supabase `analytics_events`** — продуктовые метрики, дашборд `/admin/analytics`

### Отслеживаемые события

| Событие | Где вызывается | Параметры |
|---|---|---|
| `wizard_step_completed` | Step1–Step6 | `step`, `niche`, `style` |
| `site_generated` | api/generate-site | `website_id`, `niche`, `style` |
| `site_published` | api/publish-site | `website_id`, `subdomain` |
| `site_edit_requested` | api/edit-site | `website_id` |
| `payment_success` | api/payments/webhook | `plan`, `amount` |
| `preview_opened` | PreviewClient | `website_id` |
| `support_message_sent` | support/page | — |

### Дашборд аналитики

Доступен по адресу `/admin/analytics` (только для роли `admin`). Показывает:
- KPI: генерации, оплаты, конверсия %, MAU
- Воронку по 6 шагам мастера с отсевом
- DAU за 7 дней
- AI-активность (генерации + правки) за 14 дней

### Цели в Яндекс.Метрике

Создать вручную: Метрика → счётчик → Цели → Добавить → тип «JavaScript-событие»

| Название | Идентификатор |
|---|---|
| Шаг мастера пройден | `wizard_step_completed` |
| Сайт сгенерирован | `site_generated` |
| Сайт опубликован | `site_published` |
| AI-правка | `site_edit_requested` |
| Оплата | `payment_success` |

---

## Тестирование

```bash
npm test          # watch-режим
npm run test:run  # однократный запуск (CI/CD)
```

Покрытие (~170 тестов): HTML-обработка, prompt injection защита, валидация данных, бизнес-логика тарифов, API роуты.

---

## Деплой на Vercel

### Переменные окружения (Vercel Dashboard → Settings → Environment Variables)

| Переменная | Где взять |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `ROUTERAI_API_KEY` | routerai.ru/settings/keys |
| `ROUTERAI_MODEL` | `anthropic/claude-sonnet-4-5` |
| `YC_S3_ACCESS_KEY` | Yandex Cloud → Сервисные аккаунты |
| `YC_S3_SECRET_KEY` | Yandex Cloud → Сервисные аккаунты |
| `YC_S3_BUCKET_NAME` | `vibesite-storage` |
| `YC_S3_ENDPOINT` | `https://storage.yandexcloud.net` |
| `YC_S3_REGION` | `ru-central1` |
| `YOOKASSA_SHOP_ID` | ЮKassa → Настройки → Ключи API |
| `YOOKASSA_SECRET_KEY` | ЮKassa → Настройки → Ключи API |
| `NEXT_PUBLIC_APP_URL` | `https://beauty-site.ru` |
| `NEXT_PUBLIC_APP_DOMAIN` | `beauty-site.ru` |
| `NEXT_PUBLIC_YM_ID` | Яндекс.Метрика → номер счётчика |
| `WORKER_URL` | URL VPS worker |
| `WORKER_SECRET` | секрет для авторизации worker |

### Настройка домена

```
A     @    76.76.21.21
CNAME *    cname.vercel-dns.com
```

Supabase → Authentication → URL Configuration → добавить `https://beauty-site.ru/auth/callback`

---

## ЮKassa webhook

Настройки → HTTP-уведомления → URL: `https://beauty-site.ru/api/payments/webhook`
События: `payment.succeeded`, `payment.canceled`

---

## Известные ограничения

- Поддомены на localhost не работают — тестировать через `/api/site/поддомен`
- Только одностраничные сайты
- Автопродление подписки не реализовано (нет cron)
- SSL wildcard обновлять вручную каждые 90 дней
- Максимальный размер фото: 4.5 МБ (лимит Vercel serverless)
- ЮKassa прекратила поддержку самозанятых с 29.12.2025 — уточнить условия

---

## Как стать администратором

Supabase → Table Editor → `users` → найти свою запись → поле `role` изменить на `admin`.

Даёт доступ к `/admin` и `/admin/analytics`.
