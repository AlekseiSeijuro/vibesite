import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Check, Sparkles, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const PLANS = [
  {
    slug: 'demo',
    name: 'Демо',
    priceMonthly: null,
    priceYearly: null,
    priceOnetime: null,
    description: 'Попробуйте бесплатно',
    features: [
      'Поддомен с водяным знаком',
      '1 активный сайт',
      'До 3 генераций в сутки',
      'Неограниченные правки',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
    highlight: false,
  },
  {
    slug: 'subdomain',
    name: 'Поддомен',
    priceMonthly: 700,
    priceYearly: 6000,
    priceOnetime: null,
    description: 'Для активных мастеров',
    features: [
      'Свой поддомен имя.vibesite.ru',
      'Без водяного знака',
      'Неограниченные генерации',
      'До 5 активных сайтов',
      'Редактирование в любое время',
    ],
    cta: 'Выбрать тариф',
    href: '/dashboard/billing',
    highlight: true,
  },
  {
    slug: 'custom_domain',
    name: 'Свой домен',
    priceMonthly: null,
    priceYearly: null,
    priceOnetime: 3500,
    description: 'Максимальная свобода',
    features: [
      'Подключение своего домена',
      'Передача исходных файлов',
      'Без водяного знака',
      'Помощь менеджера по настройке',
      'Инструкция по размещению',
    ],
    cta: 'Оставить заявку',
    href: '/dashboard/billing',
    highlight: false,
  },
]

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-gray-900">Vibesite</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-secondary text-sm">
                Личный кабинет
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Войти</Link>
                <Link href="/register" className="btn-primary text-sm">Попробовать</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Простые и понятные тарифы
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            Начните бесплатно, перейдите на платный тариф когда будете готовы
          </p>
        </div>

        {/* Карточки тарифов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <PlanCard key={plan.slug} plan={plan} isLoggedIn={!!user} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Частые вопросы
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="card">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function PlanCard({ plan, isLoggedIn }: {
  plan: typeof PLANS[0]
  isLoggedIn: boolean
}) {
  const href = plan.slug === 'demo' && isLoggedIn ? '/dashboard' : plan.href

  return (
    <div className={`card flex flex-col relative ${
      plan.highlight
        ? 'border-brand-400 border-2 shadow-lg shadow-brand-100'
        : ''
    }`}>
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Популярный
          </span>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </div>

      {/* Цена */}
      <div className="mb-6">
        {plan.priceMonthly ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">
                {formatPrice(plan.priceMonthly)}
              </span>
              <span className="text-gray-400 text-sm">/мес</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              или {formatPrice(plan.priceYearly!)} /год — экономия{' '}
              {formatPrice(plan.priceMonthly * 12 - plan.priceYearly!)}
            </p>
          </div>
        ) : plan.priceOnetime ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(plan.priceOnetime)}
            </span>
            <span className="text-gray-400 text-sm">разово</span>
          </div>
        ) : (
          <span className="text-4xl font-bold text-gray-900">Бесплатно</span>
        )}
      </div>

      {/* Фичи */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={plan.highlight ? 'btn-primary justify-center' : 'btn-secondary justify-center'}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

const FAQ = [
  {
    q: 'Можно ли поменять данные после генерации?',
    a: 'Да, вы можете редактировать данные и перегенерировать сайт в любое время через личный кабинет.',
  },
  {
    q: 'Что происходит по окончании подписки?',
    a: 'Сайт остаётся доступным, но появляется водяной знак. Вы можете продлить подписку в любое время.',
  },
  {
    q: 'Как работает тариф «Свой домен»?',
    a: 'После оплаты менеджер свяжется с вами, поможет подключить домен и передаст исходные файлы сайта.',
  },
  {
    q: 'Поддерживаются ли мобильные устройства?',
    a: 'Все сайты генерируются с адаптивной вёрсткой — корректно отображаются на телефонах, планшетах и компьютерах.',
  },
]
