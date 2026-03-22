import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDate, formatPrice } from '@/lib/utils'
import PaymentButtons from '@/components/dashboard/PaymentButtons'
import type { Subscription } from '@/types'

function StatusIcon({ status }: { status: string }) {
  if (status === 'active') return <CheckCircle className="h-5 w-5 text-green-500" />
  if (status === 'trial')  return <Clock className="h-5 w-5 text-yellow-500" />
  return <XCircle className="h-5 w-5 text-gray-400" />
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, subscription_ends_at')
    .eq('id', user!.id)
    .single()

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*, websites(meta_data)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  // Получаем первый опубликованный/демо сайт для кнопок оплаты
  const { data: sites } = await supabase
    .from('websites')
    .select('id, meta_data, status')
    .eq('user_id', user!.id)
    .in('status', ['demo', 'published', 'draft'])
    .order('created_at', { ascending: false })
    .limit(5)

  const subs = (subscriptions ?? []) as (Subscription & {
    websites: { meta_data: { master_name?: string } } | null
  })[]

  const statusLabel: Record<string, string> = {
    trial:   'Демо (бесплатно)',
    active:  'Активна',
    expired: 'Истекла',
  }

  const isPaid = profile?.subscription_status === 'active'

  return (
    <div className="space-y-8 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Подписка</h1>
        <p className="text-gray-500 text-sm mt-1">Управление тарифом и история платежей</p>
      </div>

      {/* Текущий тариф */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-brand-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Текущий тариф</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 mb-5">
          <div className="flex items-center gap-3">
            <StatusIcon status={profile?.subscription_status ?? 'trial'} />
            <div>
              <p className="font-medium text-gray-900">
                {statusLabel[profile?.subscription_status ?? 'trial']}
              </p>
              {profile?.subscription_ends_at && (
                <p className="text-xs text-gray-500 mt-0.5">
                  До {formatDate(profile.subscription_ends_at)}
                </p>
              )}
              {profile?.subscription_status === 'trial' && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Сайт публикуется с водяным знаком
                </p>
              )}
            </div>
          </div>
          <Link href="/pricing" className="btn-secondary text-sm">
            Все тарифы
          </Link>
        </div>

        {/* Кнопки оплаты — только если не оплачено */}
        {!isPaid && (
          <PaymentButtons sites={sites ?? []} />
        )}
      </div>

      {/* История платежей */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-5">История платежей</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Платежей пока нет</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {subs.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {sub.websites?.meta_data?.master_name ?? 'Сайт'}
                    {' — '}
                    {sub.plan === 'subdomain' ? 'Поддомен' : 'Свой домен'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(sub.created_at)}
                    {sub.end_date && ` — ${formatDate(sub.end_date)}`}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 shrink-0">
                  {formatPrice(sub.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
