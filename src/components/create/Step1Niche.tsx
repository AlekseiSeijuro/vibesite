'use client'

import { useCreateSiteStore } from '@/store/createSiteStore'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import type { BeautyNiche } from '@/types'

const NICHES: { value: BeautyNiche; label: string; emoji: string; desc: string }[] = [
  { value: 'manicure',     label: 'Маникюр',      emoji: '💅', desc: 'Ногтевой сервис, гель-лак, наращивание' },
  { value: 'pedicure',     label: 'Педикюр',      emoji: '🦶', desc: 'Уход за стопами и ногтями на ногах' },
  { value: 'eyebrows',     label: 'Брови',         emoji: '✨', desc: 'Коррекция, окрашивание, ламинирование' },
  { value: 'lashes',       label: 'Ресницы',       emoji: '👁️', desc: 'Наращивание, ламинирование ресниц' },
  { value: 'cosmetology',  label: 'Косметология',  emoji: '🌸', desc: 'Уход за кожей, чистки, пилинги' },
  { value: 'massage',      label: 'Массаж',        emoji: '💆', desc: 'Релакс, лечебный, антицеллюлитный' },
  { value: 'makeup',       label: 'Макияж',        emoji: '💄', desc: 'Свадебный, вечерний, дневной' },
  { value: 'hair',         label: 'Волосы',        emoji: '💇', desc: 'Стрижки, окрашивание, укладки' },
  { value: 'other',        label: 'Другое',        emoji: '🌟', desc: 'Другая бьюти-услуга' },
]

export default function Step1Niche() {
  const { formData, updateFormData, nextStep } = useCreateSiteStore()

  const handleSelect = (niche: BeautyNiche) => {
    updateFormData({ niche })
    track('wizard_step_completed', { step: 1, niche })
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Выберите вашу нишу</h2>
      <p className="text-gray-500 text-sm mb-6">
        Это поможет ИИ создать подходящий дизайн и тексты
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NICHES.map((niche) => (
          <button
            key={niche.value}
            onClick={() => handleSelect(niche.value)}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-brand-300 hover:bg-brand-50',
              formData.niche === niche.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <span className="text-3xl">{niche.emoji}</span>
            <div>
              <p className="font-semibold text-gray-900">{niche.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{niche.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
