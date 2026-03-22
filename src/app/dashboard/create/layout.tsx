'use client'

import { useCreateSiteStore } from '@/store/createSiteStore'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { n: 1, label: 'Ниша' },
  { n: 2, label: 'О себе' },
  { n: 3, label: 'Контакты' },
  { n: 4, label: 'Услуги' },
  { n: 5, label: 'Стиль' },
  { n: 6, label: 'Фото' },
]

export default function CreateSiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const step = useCreateSiteStore((s) => s.step)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Создать сайт</h1>
        <p className="text-gray-500 text-sm">
          Шаг {step} из {STEPS.length}
        </p>
      </div>

      {/* Прогресс */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            {/* Кружок */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  s.n < step
                    ? 'bg-brand-600 text-white'
                    : s.n === step
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {s.n < step ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium hidden sm:block',
                  s.n === step ? 'text-brand-600' : 'text-gray-400'
                )}
              >
                {s.label}
              </span>
            </div>

            {/* Линия между шагами */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 transition-all',
                  s.n < step ? 'bg-brand-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Контент шага */}
      <div className="card shadow-sm">{children}</div>
    </div>
  )
}
