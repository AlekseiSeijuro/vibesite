'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { isYookassaConfigured } from '@/lib/yookassa/client'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { PLAN_CONFIGS, getPlanAmount } from '@/lib/yookassa/plans'

interface Site {
  id: string
  meta_data: { master_name?: string } | null
  status: string
}

interface Props {
  sites: Site[]
}

const PAYMENT_OPTIONS = [
  { key: 'subdomain_monthly', label: 'Поддомен — месяц', desc: '699 ₽/мес — без водяного знака, свой поддомен' },
  { key: 'subdomain_yearly',  label: 'Поддомен — год',   desc: `5 999 ₽/год — экономия ${formatPrice(699 * 12 - 5999)}` },
  { key: 'custom_domain',     label: 'Свой домен',        desc: 'Разово — исходники + помощь с публикацией на ваш домен' },
]

export default function PaymentButtons({ sites }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState(sites[0]?.id ?? '')

  // Если ЮKassa не настроена — показываем заглушку
  const configured = typeof window !== 'undefined'
    ? true // на клиенте всегда показываем UI
    : false

  const handlePay = async (planKey: string) => {
    if (!selectedSite) {
      toast.error('Выберите сайт для оплаты')
      return
    }

    setLoading(planKey)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, websiteId: selectedSite }),
      })

      const data = await res.json()

      if (data.code === 'YOOKASSA_NOT_CONFIGURED') {
        toast.error('Платёжная система пока не подключена. Скоро появится!')
        return
      }

      if (!res.ok) {
        throw new Error(data.error ?? 'Ошибка')
      }

      // Редирект на страницу оплаты ЮKassa
      window.location.href = data.confirmationUrl
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка оплаты')
    } finally {
      setLoading(null)
    }
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Сначала создайте сайт, затем выберите тариф
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Оформить подписку</p>

      {/* Выбор сайта если несколько */}
      {sites.length > 1 && (
        <div>
          <label className="label">Для какого сайта</label>
          <select
            className="input"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.meta_data?.master_name ?? 'Без названия'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Варианты оплаты */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handlePay(opt.key)}
            disabled={!!loading}
            className="p-4 rounded-xl border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            <p className="text-brand-600 font-bold mt-2">
              {formatPrice(getPlanAmount(opt.key))}
            </p>
            {loading === opt.key && (
              <p className="text-xs text-gray-400 mt-1">Перенаправление...</p>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Оплата через ЮKassa — банковские карты, СБП, ЮMoney и другие способы
      </p>
    </div>
  )
}
