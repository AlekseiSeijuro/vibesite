import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import SiteActions from './SiteActions'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 20

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createAdminClient()
  const status = searchParams.status ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('websites')
    .select('*, users(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: sites, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const STATUSES = ['', 'draft', 'demo', 'published', 'archived']
  const statusLabel: Record<string, string> = {
    draft: 'Черновик', demo: 'Демо', published: 'Опубликован', archived: 'Архив',
  }
  const statusClass: Record<string, string> = {
    draft: 'badge-gray', demo: 'badge-yellow',
    published: 'badge-green', archived: 'badge-gray',
  }
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vibesite.ru'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Сайты</h1>
        <p className="text-gray-500 text-sm mt-1">Всего: {count ?? 0}</p>
      </div>

      {/* Фильтр по статусу */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/sites?status=${s}` : '/admin/sites'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s ? statusLabel[s] : 'Все'}
          </Link>
        ))}
      </div>

      {/* Таблица */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Поддомен</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Мастер</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Владелец</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Создан</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(sites ?? []).map((site) => {
                const masterName =
                  (site.meta_data as { master_name?: string })?.master_name ?? '—'
                const siteUrl = site.subdomain
                  ? `https://${site.subdomain}.${domain}`
                  : null

                return (
                  <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {siteUrl ? (
                        <a
                          href={siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline font-mono text-xs"
                        >
                          {site.subdomain}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {masterName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(site.users as unknown as { email: string })?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusClass[site.status] ?? 'badge-gray'}>
                        {statusLabel[site.status] ?? site.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(site.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <SiteActions siteId={site.id} status={site.status} />
                    </td>
                  </tr>
                )
              })}
              {(sites ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Сайты не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={`/admin/sites?status=${status}&page=${page - 1}`} className="btn-secondary text-sm">
              ← Назад
            </Link>
          )}
          <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/sites?status=${status}&page=${page + 1}`} className="btn-secondary text-sm">
              Вперёд →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
