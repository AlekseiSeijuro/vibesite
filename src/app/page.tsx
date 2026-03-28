'use client'

import Link from 'next/link'
import { Sparkles, Zap, Globe, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const EXAMPLES = [
  {
    subdomain: 'anna-nails',
    title: 'Анна Соколова',
    niche: 'Мастер маникюра · Москва',
    style: 'Дружелюбный стиль',
    color: 'bg-rose-50',
  },
  {
    subdomain: 'arch-brows',
    title: 'Студия ARCH',
    niche: 'Брови · Санкт-Петербург',
    style: 'Премиальный стиль',
    color: 'bg-stone-900',
  },
  {
    subdomain: 'elena-cosmo',
    title: 'Елена Козлова',
    niche: 'Косметолог · Казань',
    style: 'Лаконичный стиль',
    color: 'bg-gray-50',
  },
]

function ExamplesSection() {
  const [active, setActive] = useState(0)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://beauty-site.ru'

  const prev = () => setActive((i) => (i === 0 ? EXAMPLES.length - 1 : i - 1))
  const next = () => setActive((i) => (i === EXAMPLES.length - 1 ? 0 : i + 1))

  const example = EXAMPLES[active]
  const siteUrl = `${appUrl}/api/site/${example.subdomain}`

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Примеры готовых сайтов
          </h2>
          <p className="text-gray-500">
            Реальные сайты созданные нашим сервисом — три разных стиля
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Список примеров */}
          <div className="flex flex-row lg:flex-col gap-3 lg:w-64 shrink-0 w-full overflow-x-auto pb-2 lg:pb-0">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.subdomain}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 text-left p-4 rounded-2xl border-2 transition-all w-48 lg:w-full ${
                  active === i
                    ? 'border-brand-500 bg-white shadow-sm'
                    : 'border-transparent bg-white hover:border-gray-200'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{ex.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ex.niche}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  i === 0 ? 'bg-rose-100 text-rose-700' :
                  i === 1 ? 'bg-stone-100 text-stone-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {ex.style}
                </span>
              </button>
            ))}
          </div>

          {/* Превью */}
          <div className="flex-1 min-w-0">
            {/* Браузер-бар */}
            <div className="bg-gray-200 rounded-t-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono truncate">
                {example.subdomain}.beauty-site.ru
              </div>
              <div className="flex gap-1">
                <button
                  onClick={prev}
                  className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={next}
                  className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* iframe */}
            <div
              className="bg-white rounded-b-2xl overflow-hidden shadow-xl border border-gray-200 border-t-0"
              style={{ height: '520px' }}
            >
              <iframe
                key={example.subdomain}
                src={siteUrl}
                className="w-full h-full border-none"
                title={example.title}
                sandbox="allow-same-origin allow-scripts"
                loading="lazy"
              />
            </div>

            {/* Кнопка открыть */}
            <div className="mt-4 text-center">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 hover:underline"
              >
                Открыть в полном размере →
              </a>
            </div>
          </div>
        </div>

        {/* Индикаторы */}
        <div className="flex justify-center gap-2 mt-8">
          {EXAMPLES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                active === i ? 'bg-brand-600 w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Навигация */}
      <header className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-600" />
              <span className="text-lg font-bold text-gray-900">Vibesite</span>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/pricing" className="btn-ghost text-sm hidden sm:inline-flex">
                Тарифы
              </Link>
              <Link href="/login" className="btn-secondary text-sm">
                Войти
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                <span className="hidden sm:inline">Создать сайт</span>
                <span className="sm:hidden">Начать</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm text-brand-700 font-medium mb-8">
          <Sparkles className="h-4 w-4" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">
          Сайт для мастера бьюти{' '}
          <span className="text-brand-600">за 2 минуты</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto text-balance">
          Заполните анкету, загрузите фото работ — ИИ создаст красивый
          адаптивный сайт-визитку. Никакого кода и дизайнера.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Создать сайт бесплатно
          </Link>
          <Link href="#examples" className="btn-secondary text-base px-8 py-3">
            Смотреть примеры
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Демо-версия бесплатна — не нужно вводить данные карты или оплачивать заранее.
          Платный тариф подключается только если захотите убрать водяной знак.
        </p>
      </section>

      {/* Примеры сайтов */}
      <div id="examples">
        <ExamplesSection />
      </div>

      {/* Как работает */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Три шага до готового сайта
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Заполните анкету',
                desc: 'Укажите нишу, имя, услуги с ценами и контакты. Это займёт 3–5 минут.',
              },
              {
                step: '02',
                title: 'Загрузите фото',
                desc: 'Добавьте 5–10 фотографий своих работ. ИИ подберёт цвета под ваш стиль.',
              },
              {
                step: '03',
                title: 'Получите сайт',
                desc: 'Claude создаёт уникальный адаптивный HTML/CSS сайт. Опубликуйте одной кнопкой.',
              },
            ].map((item) => (
              <div key={item.step} className="card">
                <div className="text-4xl font-bold text-brand-100 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Всё что нужно мастеру
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap,      title: 'Быстро',      desc: 'Сайт готов через 2 минуты после заполнения анкеты' },
              { icon: Globe,    title: 'Свой адрес',  desc: 'Поддомен вида имя.beauty-site.ru или ваш собственный домен' },
              { icon: Shield,   title: 'Адаптивный',  desc: 'Корректно отображается на телефоне, планшете и компьютере' },
              { icon: Sparkles, title: 'Уникальный',  desc: 'Каждый сайт генерируется индивидуально, не шаблон' },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
                  <item.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы попробовать?
          </h2>
          <p className="text-brand-100 mb-8">
            Демо-версия бесплатна — регистрация без оплаты.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-medium text-brand-600 transition hover:bg-brand-50"
          >
            <Sparkles className="h-5 w-5" />
            Создать сайт бесплатно
          </Link>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium">Vibesite</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Vibesite. Все права защищены.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-400">
            <a href="tel:+79103025790" className="hover:text-gray-600 transition-colors">
              📞 8 910 302 57 90
            </a>
            <Link href="/privacy" className="hover:text-gray-600">
              Конфиденциальность
            </Link>
            <Link href="/terms" className="hover:text-gray-600">
              Условия
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
