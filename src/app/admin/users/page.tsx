import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select(`
      id, email, role, subscription_status, created_at,
      websites(count)
    `)
    .order('created_at', { ascending: false })

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <p className="text-gray-500 text-sm mt-1">
          Всего: {users?.length ?? 0}
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Подписка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Сайтов</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Зарегистрирован</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(users ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={u.role === 'admin' ? 'badge-purple' : 'badge-gray'}>
                    {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={statusColors[u.subscription_status] ?? 'badge-gray'}>
                    {statusLabels[u.subscription_status] ?? u.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {(u.websites as unknown as { count: number }[])?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(users ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-12 text-sm">
            Пользователей пока нет
          </p>
        )}
      </div>
    </div>
  )
}
