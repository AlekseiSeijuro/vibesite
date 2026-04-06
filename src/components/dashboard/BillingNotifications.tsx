'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, FlaskConical, X } from 'lucide-react'

export default function BillingNotifications() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [notification, setNotification] = useState<'payment_success' | 'topup_success' | 'canceled' | null>(null)
  const isTestMode = process.env.NEXT_PUBLIC_YOOKASSA_TEST_MODE === 'true'

  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status')
    const topupStatus = searchParams.get('topup_status')

    if (paymentStatus === 'success') setNotification('payment_success')
    else if (topupStatus === 'success') setNotification('topup_success')
    else if (paymentStatus === 'canceled') setNotification('canceled')

    // Убираем query params из URL не перезагружая страницу
    if (paymentStatus || topupStatus) {
      router.replace('/dashboard/billing')
    }
  }, [])

  return (
    <>
      {/* Тестовый режим */}
      {isTestMode && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
          <FlaskConical className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-700">
            <span className="font-semibold">Тестовый режим.</span>{' '}
            Используйте карту <span className="font-mono font-semibold">5555 5555 5555 4444</span>,
            любой срок действия и CVC для тестовой оплаты.
          </p>
        </div>
      )}

      {/* Уведомление об успешной оплате подписки */}
      {notification === 'payment_success' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">Оплата прошла успешно!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Подписка активирована. Водяной знак убран со всех ваших сайтов,
              публикация на поддомене доступна.
            </p>
          </div>
          <button onClick={() => setNotification(null)} className="text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Уведомление об успешном пополнении баланса */}
      {notification === 'topup_success' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-800">Баланс пополнен!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Правки для AI-редактора зачислены на ваш баланс.
            </p>
          </div>
          <button onClick={() => setNotification(null)} className="text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Уведомление об отмене */}
      {notification === 'canceled' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Оплата отменена</p>
            <p className="text-sm text-red-700 mt-0.5">
              Платёж не был завершён. Попробуйте ещё раз.
            </p>
          </div>
          <button onClick={() => setNotification(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  )
}
