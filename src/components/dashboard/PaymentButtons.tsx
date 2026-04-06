'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { getPlanAmount } from '@/lib/yookassa/plans'

const PAYMENT_OPTIONS = [
  { key: 'subdomain_monthly', label: 'Поддомен — месяц', desc: '699 ₽/мес — без водяного знака, свой поддомен' },
  { key: 'subdomain_yearly',  label: 'Поддомен — год',   desc: `5 999 ₽/год — экономия ${formatPrice(699 * 12 - 5999)}` },
  { key: 'custom_domain',     label: 'Свой домен',        desc: 'Разово — исходники + помощь с публикацией на ваш домен' },
]

export default function PaymentButtons({ isPaid = false }: { isPaid?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handlePay = async (planKey: string) => {
    setLoading(planKey)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const data = await res.json()

      if (data.code === 'YOOKASSA_NOT_CONFIGURED') {
        toast.error('Платёжная система пока не подключена. Скоро появится!')
        return
      }

      if (!res.ok) throw new Error(data.error ?? 'Ошибка')

      window.location.href = data.confirmationUrl
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка оплаты')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">
        {isPaid ? 'Подключить свой домен' : 'Оформить подписку'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PAYMENT_OPTIONS.filter(opt =>
          isPaid ? opt.key === 'custom_domain' : true
        ).map((opt) => (
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
