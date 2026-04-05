'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const PACKAGES = [
  { id: 'topup_5',  edits: 5,  amount: 245,  popular: false },
  { id: 'topup_10', edits: 10, amount: 490,  popular: true  },
  { id: 'topup_20', edits: 20, amount: 980,  popular: false },
]

interface Props {
  currentBalance: number
}

export default function BalanceTopup({ currentBalance }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleTopup = async (packageId: string) => {
    setLoading(packageId)
    try {
      const res = await fetch('/api/balance/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
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
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">AI-редактор правок</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Баланс: <span className="font-semibold text-gray-900">{currentBalance} ₽</span>
            <span className="ml-1 text-gray-400">· 49 ₽ за правку</span>
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-5">
        Пополните баланс чтобы вносить точечные правки на сайт через AI-редактор
        прямо со страницы предпросмотра.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => handleTopup(pkg.id)}
            disabled={!!loading}
            className={`relative p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              pkg.popular
                ? 'border-brand-400 bg-brand-50 hover:bg-brand-100'
                : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Выгодно
              </span>
            )}
            <p className="font-semibold text-gray-900">{pkg.edits} правок</p>
            <p className="text-xs text-gray-500 mt-0.5">по 49 ₽ каждая</p>
            <p className="text-brand-600 font-bold text-lg mt-2">
              {formatPrice(pkg.amount)}
            </p>
            {loading === pkg.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Оплата через ЮKassa — банковские карты, СБП, ЮMoney. Баланс зачисляется сразу после оплаты.
      </p>
    </div>
  )
}
