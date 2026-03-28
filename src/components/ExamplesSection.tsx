'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const EXAMPLES = [
  {
    subdomain: 'anna-nails',
    title: 'Анна Соколова',
    niche: 'Мастер маникюра · Москва',
    style: 'Дружелюбный стиль',
  },
  {
    subdomain: 'arch-brows',
    title: 'Студия ARCH',
    niche: 'Брови · Санкт-Петербург',
    style: 'Премиальный стиль',
  },
  {
    subdomain: 'elena-cosmo',
    title: 'Елена Козлова',
    niche: 'Косметолог · Казань',
    style: 'Лаконичный стиль',
  },
]

export default function ExamplesSection() {
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
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium bg-brand-50 text-brand-700">
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
                <button onClick={prev} className="p-1 hover:bg-gray-300 rounded-lg transition-colors">
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button onClick={next} className="p-1 hover:bg-gray-300 rounded-lg transition-colors">
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
              className={`h-2 rounded-full transition-all ${
                active === i ? 'bg-brand-600 w-6' : 'bg-gray-300 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
