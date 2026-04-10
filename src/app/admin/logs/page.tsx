import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import LogModal from './LogModal'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createAdminClient()
  const status = searchParams.status ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('generation_logs')
    .select('*, websites(meta_data, subdomain, users(email))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const statusClass: Record<string, string> = {
    success: 'badge-green',
    failed: 'badge-red',
    pending: 'badge-yellow',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Логи генерации</h1>
        <p className="text-gray-500 text-sm mt-1">Всего записей: {count ?? 0}</p>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2">
        {['', 'success', 'failed', 'pending'].map((s) => (
          <a
            key={s}
            href={s ? `/admin/logs?status=${s}` : '/admin/logs'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'Все' : s === 'success' ? 'Успешные' : s === 'failed' ? 'Ошибки' : 'Ожидание'}
          </a>
        ))}
      </div>

      {/* Таблица */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Сайт</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Попытка</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Токены</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(logs ?? []).map((log) => {
                const site = log.websites as {
                  meta_data?: { master_name?: string }
                  subdomain?: string
                  users?: { email?: string }
                } | null
                const masterName = site?.meta_data?.master_name ?? '—'
                const email = site?.users?.email ?? '—'

                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{masterName}</p>
                      {site?.subdomain && (
                        <p className="text-xs text-gray-400 font-mono">{site.subdomain}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{email}</td>
                    <td className="px-4 py-3">
                      <span className={statusClass[log.status] ?? 'badge-gray'}>
                        {log.status}
                      </span>
                      {log.error_message && (
                        <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate">
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {log.attempt_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.tokens_used ? log.tokens_used.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <LogModal
                        prompt={log.prompt_used}
                        response={log.raw_response ?? ''}
                        status={log.status}
                      />
                    </td>
                  </tr>
                )
              })}
              {(logs ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Логов нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <a href={`/admin/logs?status=${status}&page=${page - 1}`} className="btn-secondary text-sm">
              ← Назад
            </a>
          )}
          <span className="text-sm text-gray-500">
            Страница {page} из {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/admin/logs?status=${status}&page=${page + 1}`} className="btn-secondary text-sm">
              Вперёд →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
