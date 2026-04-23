'use client'

import { useState } from 'react'
import { useCreateSiteStore } from '@/store/createSiteStore'
import Button from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useEffect } from 'react'
import type { SiteStyle } from '@/types'

const STYLES: { value: SiteStyle; label: string; desc: string; colors: string[] }[] = [
  {
    value: 'laconic',
    label: 'Лаконичный',
    desc: 'Минимализм, много белого, чёткие линии. Для тех кто ценит простоту.',
    colors: ['#1a1a1a', '#ffffff', '#e5e5e5'],
  },
  {
    value: 'friendly',
    label: 'Дружелюбный',
    desc: 'Тёплые тона, мягкие формы, живой текст. Располагает к себе.',
    colors: ['#f472b6', '#fdf2f8', '#fb923c'],
  },
  {
    value: 'premium',
    label: 'Премиальный',
    desc: 'Тёмный фон, золотые акценты, элегантность. Для люкс-сегмента.',
    colors: ['#1c1917', '#d4af37', '#292524'],
  },
]

export default function Step5Style() {
  const { formData, updateFormData, nextStep, prevStep } = useCreateSiteStore()
  const [style, setStyle] = useState<SiteStyle>(formData.style ?? 'friendly')
  const [notes, setNotes] = useState(formData.style_notes ?? '')

  const onNext = () => {
    updateFormData({ style, style_notes: notes })
    track('wizard_step_completed', { step: 5, style })
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Стиль сайта</h2>
      <p className="text-gray-500 text-sm mb-6">
        ИИ подберёт цвета и оформление под выбранный стиль
      </p>

      <div className="space-y-3 mb-6">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStyle(s.value)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
              style === s.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
            )}
          >
            {/* Палитра цветов */}
            <div className="flex gap-1 shrink-0">
              {s.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>

            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                style === s.value
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-gray-300'
              )}
            >
              {style === s.value && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="label">Дополнительные пожелания</label>
        <textarea
          className="input resize-none"
          rows={3}
          maxLength={500}
          placeholder="Например: хочу розовые оттенки, больше округлых форм, логотип в шапке..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/500</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={prevStep}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <Button onClick={onNext} className="flex-1">
          Далее
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
