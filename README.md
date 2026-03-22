# Vibesite — AI-лендинг для бьюти-сферы

Сервис автоматической генерации сайтов-визиток для мастеров и салонов красоты с помощью Claude AI.

## Стек

- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **База данных:** Supabase (PostgreSQL + Auth + RLS)
- **Файлы:** Yandex Cloud Object Storage (S3)
- **AI:** RouterAI → Claude Sonnet (генерация HTML/CSS)
- **Платежи:** ЮKassa
- **Хостинг:** Vercel

---

## Быстрый старт (локально)

### 1. Установка зависимостей

```bash
cd vibesite
npm install
```

### 2. Переменные окружения

Скопируй файл примера и заполни значения:

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
```

### 3. База данных

Открой [supabase.com](https://supabase.com) → Dashboard → SQL Editor и выполни миграции по порядку:

```
supabase/migrations/001_initial_schema.sql   — таблицы, RLS, триггеры
supabase/migrations/002_fix_rls_recursion.sql — исправление политик
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
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── auth/                # OAuth callback, смена пароля
│   ├── dashboard/           # Личный кабинет
│   │   ├── create/          # Мастер создания сайта (6 шагов)
│   │   ├── preview/[id]/    # Предпросмотр и публикация
│   │   ├── billing/         # Подписка и платежи
│   │   └── settings/        # Настройки аккаунта
│   ├── admin/               # Административная панель
│   │   ├── page.tsx         # Пользователи
│   │   ├── sites/           # Управление сайтами
│   │   ├── orders/          # Заявки на свой домен
│   │   └── logs/            # Логи генерации
│   ├── api/
│   │   ├── generate-site/   # Генерация HTML через RouterAI
│   │   ├── publish-site/    # Публикация сайта
│   │   ├── regenerate-site/ # Перегенерация
│   │   ├── upload-photo/    # Загрузка фото в S3
│   │   ├── payments/        # ЮKassa: создание платежа и webhook
│   │   ├── site/[subdomain] # Отдача клиентских сайтов
│   │   ├── admin/           # Админ API
│   │   └── account/         # Управление аккаунтом
│   ├── pricing/             # Страница тарифов
│   └── site/                # Заглушка для поддоменов
├── components/
│   ├── create/              # Шаги формы (Step1–Step6)
│   ├── dashboard/           # Навигация, кнопки оплаты
│   └── ui/                  # Input, Button
├── lib/
│   ├── supabase/            # Клиенты (browser/server)
│   ├── yookassa/            # ЮKassa клиент и тарифы
│   ├── validation/          # Zod схемы
│   ├── openrouter.ts        # RouterAI клиент
│   ├── promptBuilder.ts     # Построение промпта
│   ├── htmlUtils.ts         # Обработка HTML
│   ├── s3.ts                # Yandex Cloud S3
│   ├── auth-helpers.ts      # requireAuth/requireAdmin
│   └── utils.ts             # Утилиты
├── store/
│   └── createSiteStore.ts   # Zustand стор формы
├── types/
│   └── index.ts             # TypeScript типы
└── middleware.ts             # Защита роутов + поддомены
```

---

## Деплой на Vercel

### 1. Подготовка репозитория

```bash
git init
git add .
git commit -m "initial commit"
```

Создай репозиторий на GitHub и запушь:

```bash
git remote add origin https://github.com/твой-аккаунт/vibesite.git
git push -u origin main
```

### 2. Подключение к Vercel

1. Зайди на [vercel.com](https://vercel.com) и войди через GitHub
2. Нажми **Add New Project**
3. Выбери репозиторий `vibesite`
4. Vercel автоматически определит Next.js — нажми **Deploy**

### 3. Переменные окружения на Vercel

В Dashboard проекта → **Settings → Environment Variables** добавь все переменные из `.env.local`:

| Переменная | Где взять |
|-----------|-----------|
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
| `NEXT_PUBLIC_APP_URL` | `https://твой-домен.ru` |
| `NEXT_PUBLIC_APP_DOMAIN` | `твой-домен.ru` |

### 4. Настройка домена

1. Vercel Dashboard → **Settings → Domains**
2. Добавь свой домен: `vibesite.ru`
3. Добавь wildcard для поддоменов клиентов: `*.vibesite.ru`
4. Настрой DNS у регистратора домена:
   ```
   A     @    76.76.21.21
   CNAME *    cname.vercel-dns.com
   ```

### 5. Настройка Supabase для продакшна

В Supabase → **Authentication → URL Configuration** добавь:
```
https://твой-домен.ru/auth/callback
```

---

## Подключение ЮKassa

1. Зарегистрируйся на [yookassa.ru](https://yookassa.ru) и подключи магазин
2. Получи ключи: **Настройки → Ключи API**
3. Добавь ключи в `.env.local` и Vercel
4. Настрой webhook в ЮKassa:
   - **Настройки → HTTP-уведомления**
   - URL: `https://твой-домен.ru/api/payments/webhook`
   - События: `payment.succeeded`, `payment.canceled`

---

## Как сделать себя администратором

После регистрации открой Supabase → **Table Editor → users** → найди свою запись → измени поле `role` с `user` на `admin`.

Тогда будет доступна страница `/admin`.

---

## Смена модели AI

В `.env.local` измени одну строку:

```env
ROUTERAI_MODEL=anthropic/claude-opus-4-5
```

Список доступных моделей: [routerai.ru/models](https://routerai.ru/models)

---

## Тестирование клиентских сайтов локально

Поддомены не работают на localhost. Для локального теста открывай напрямую:

```
http://localhost:3000/api/site/твой-поддомен
```

На проде с настроенным wildcard DNS сайт откроется по адресу:

```
https://имя-мастера.vibesite.ru
```
