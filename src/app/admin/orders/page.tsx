import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import OrderActions from './OrderActions'

interface SearchParams {
  status?: string
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createAdminClient()
  const status = searchParams.status ?? ''

  let query = supabase
    .from('orders')
    .select('*, users(email), websites(meta_data, subdomain)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: orders, count } = await query

  const STATUSES = ['', 'new', 'in_progress', 'completed', 'cancelled']
  const statusLabel: Record<string, string> = {
    new: 'Новая', in_progress: 'В работе',
    completed: 'Выполнена', cancelled: 'Отменена',
  }
  const statusClass: Record<string, string> = {
    new: 'badge-yellow', in_progress: 'badge-purple',
    completed: 'badge-green', cancelled: 'badge-gray',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>
        <p className="text-gray-500 text-sm mt-1">
          Заявки на тариф «Свой домен + исходники» — всего: {count ?? 0}
        </p>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s ? statusLabel[s] : 'Все'}
          </a>
        ))}
      </div>

      {/* Таблица */}
      <div className="space-y-4">
        {(orders ?? []).length === 0 && (
          <div className="card text-center py-12 text-gray-400">
            Заявок нет
          </div>
        )}
        {(orders ?? []).map((order) => {
          const masterName =
            (order.websites as { meta_data?: { master_name?: string } })
              ?.meta_data?.master_name ?? '—'
          const email =
            (order.users as { email?: string })?.email ?? '—'
          const subdomain =
            (order.websites as { subdomain?: string })?.subdomain ?? null

          return (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{masterName}</span>
                    <span className={statusClass[order.status] ?? 'badge-gray'}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{email}</p>
                  {subdomain && (
                    <p className="text-xs text-brand-600 font-mono">{subdomain}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Создана: {formatDate(order.created_at)}
                    {order.completed_at && ` · Выполнена: ${formatDate(order.completed_at)}`}
                  </p>
                  {order.admin_notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                      📝 {order.admin_notes}
                    </p>
                  )}
                </div>

                <OrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  currentNotes={order.admin_notes ?? ''}
                  userEmail={email}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
