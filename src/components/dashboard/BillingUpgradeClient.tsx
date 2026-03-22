'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'

const PLAN_INFO = {
  subdomain: {
    name: 'Поддомен',
    price: '700 ₽/мес или 6 000 ₽/год',
    description: 'Свой поддомен без водяного знака, неограниченные генерации',
  },
  custom_domain: {
    name: 'Свой домен + исходники',
    price: '3 500 ₽ разово',
    description: 'Подключение своего домена и передача исходных файлов',
  },
}

export default function BillingUpgradeClient({
  plan,
  userEmail,
}: {
  plan: 'subdomain' | 'custom_domain'
  userEmail: string
}) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const info = PLAN_INFO[plan]

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) throw new Error('Ошибка')
      setSubmitted(true)
    } catch {
      toast.error('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="card max-w-md mx-auto text-center py-10">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Заявка принята!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Мы свяжемся с вами на {userEmail} в течение рабочего дня.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex">
          Вернуться в дашборд
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{info.name}</h2>
            <p className="text-sm text-brand-600 font-medium">{info.price}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">{info.description}</p>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100 mb-6">
          <Clock className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            Онлайн-оплата картой скоро будет доступна. Пока оставьте заявку —
            мы свяжемся с вами и согласуем удобный способ оплаты.
          </p>
        </div>

        <Button onClick={handleSubmit} loading={loading} className="w-full">
          Оставить заявку на тариф «{info.name}»
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Нажимая кнопку, вы соглашаетесь с{' '}
        <Link href="/terms" className="underline hover:text-gray-600">
          условиями использования
        </Link>
      </p>
    </div>
  )
}
