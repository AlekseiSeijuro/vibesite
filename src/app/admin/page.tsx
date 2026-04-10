import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface SearchParams {
  q?: string
  page?: string
}

const PAGE_SIZE = 20

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createAdminClient()
  const q = searchParams.q?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('users')
    .select('*, websites(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (q) {
    query = query.ilike('email', `%${q}%`)
  }

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const statusLabel: Record<string, string> = {
    trial: 'Демо',
    active: 'Активна',
    expired: 'Истекла',
  }
  const statusClass: Record<string, string> = {
    trial: 'badge-yellow',
    active: 'badge-green',
    expired: 'badge-gray',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-500 text-sm mt-1">Всего: {count ?? 0}</p>
        </div>
      </div>

      {/* Поиск */}
      <form method="GET" className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по email..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-secondary">
          Найти
        </button>
        {q && (
          <Link href="/admin" className="btn-ghost">
            Сбросить
          </Link>
        )}
      </form>

      {/* Таблица */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Подписка</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Сайтов</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Зарегистрирован</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="badge-purple">Админ</span>
                    ) : (
                      <span className="badge-gray">Пользователь</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusClass[user.subscription_status] ?? 'badge-gray'}>
                      {statusLabel[user.subscription_status] ?? user.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(user.websites as unknown as { count: number }[])?.[0]?.count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Пользователи не найдены
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
            <Link href={`/admin?q=${q}&page=${page - 1}`} className="btn-secondary text-sm">
              ← Назад
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Страница {page} из {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin?q=${q}&page=${page + 1}`} className="btn-secondary text-sm">
              Вперёд →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
