import { createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()

  const { data: users } = await supabase
    .from('users')
    .select(`
      id, email, role, subscription_status, subscription_ends_at, edit_balance, created_at,
      websites(count)
    `)
    .order('created_at', { ascending: false })

  // Загружаем все подписки сразу
  const { data: allSubscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  const subsByUser = (allSubscriptions ?? []).reduce<Record<string, typeof allSubscriptions>>((acc, sub) => {
    if (!acc[sub.user_id]) acc[sub.user_id] = []
    acc[sub.user_id]!.push(sub)
    return acc
  }, {})

  const statusColors: Record<string, string> = {
    trial:   'badge-yellow',
    active:  'badge-green',
    expired: 'badge-red',
  }

  const statusLabels: Record<string, string> = {
    trial:   'Демо',
    active:  'Активна',
    expired: 'Истекла',
  }

  const planLabels: Record<string, string> = {
    subdomain:     'Поддомен',
    custom_domain: 'Свой домен',
    demo:          'Демо',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <p className="text-gray-500 text-sm mt-1">
          Всего: {users?.length ?? 0}
        </p>
      </div>

      <div className="space-y-3">
        {(users ?? []).map((u) => {
          const subs = subsByUser[u.id] ?? []
          const websiteCount = (u.websites as unknown as { count: number }[])?.[0]?.count ?? 0

          return (
            <div key={u.id} className="card">
              {/* Основная строка пользователя */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Email и роль */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 truncate">{u.email}</span>
                    <span className={u.role === 'admin' ? 'badge-purple' : 'badge-gray'}>
                      {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Зарегистрирован {formatDate(u.created_at)}
                  </p>
                </div>

                {/* Подписка */}
                <div className="text-center">
                  <span className={statusColors[u.subscription_status] ?? 'badge-gray'}>
                    {statusLabels[u.subscription_status] ?? u.subscription_status}
                  </span>
                  {u.subscription_ends_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      до {formatDate(u.subscription_ends_at)}
                    </p>
                  )}
                </div>

                {/* Сайтов */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{websiteCount}</p>
                  <p className="text-xs text-gray-400">сайтов</p>
                </div>

                {/* Баланс */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{u.edit_balance ?? 0} ₽</p>
                  <p className="text-xs text-gray-400">баланс</p>
                </div>

                {/* Платежей */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{subs.length}</p>
                  <p className="text-xs text-gray-400">платежей</p>
                </div>
              </div>

              {/* История платежей */}
              {subs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">История платежей</p>
                  <div className="space-y-1.5">
                    {subs.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={sub.type === 'balance_topup' ? 'badge-purple' : 'badge-gray'}>
                            {sub.type === 'balance_topup' ? 'AI-редактор' : planLabels[sub.plan] ?? sub.plan}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatDate(sub.created_at)}
                            {sub.end_date ? ` — ${formatDate(sub.end_date)}` : sub.type !== 'balance_topup' ? ' · разово' : ''}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(sub.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {(users ?? []).length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">Пользователей пока нет</p>
          </div>
        )}
      </div>
    </div>
  )
}
