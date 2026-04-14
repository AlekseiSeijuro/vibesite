import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Globe, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Website } from '@/types'

function StatusBadge({ status }: { status: Website['status'] }) {
  const map = {
    draft:      { label: 'Черновик',    class: 'badge-gray' },
    generating: { label: 'Генерация...', class: 'badge-blue' },
    demo:       { label: 'Демо',        class: 'badge-yellow' },
    published:  { label: 'Опубликован', class: 'badge-green' },
    archived:   { label: 'Архив',       class: 'badge-gray' },
  }
  const s = map[status] ?? { label: status, class: 'badge-gray' }
  return <span className={s.class}>{s.label}</span>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: websites } = await supabase
    .from('websites')
    .select('id, user_id, subdomain, custom_domain, status, meta_data, data_hash, subscription_plan, is_source_code_provided, created_at, published_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, subscription_ends_at')
    .eq('id', user!.id)
    .single()

  const list = (websites ?? []) as Website[]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои сайты</h1>
          <p className="text-gray-500 text-sm mt-1">
            {list.length === 0
              ? 'У вас пока нет сайтов'
              : `${list.length} ${list.length === 1 ? 'сайт' : list.length < 5 ? 'сайта' : 'сайтов'}`}
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary">
          <Plus className="h-4 w-4" />
          Создать сайт
        </Link>
      </div>

      {profile?.subscription_status === 'trial' && (
        <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-800">Вы на демо-тарифе</p>
              <p className="text-xs text-brand-600 mt-0.5">
                Опубликуйте сайт без водяного знака — перейдите на платный тариф
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-primary shrink-0 text-xs px-3 py-2">
            Тарифы
          </Link>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  )
}

function SiteCard({ site }: { site: Website }) {
  const masterName =
    (site.meta_data as { master_name?: string })?.master_name ?? 'Новый сайт'

  return (
    <div className="card hover:shadow-md transition-shadow p-0 overflow-hidden">
      {/* Превью — iframe в контейнере с правильным масштабом */}
      <div
        className="relative w-full bg-gradient-to-br from-brand-50 to-purple-50"
        style={{ height: '180px', overflow: 'hidden' }}
      >
        {(site.status === 'demo' || site.status === 'published') ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '1280px',
              height: '800px',
              transform: 'translateX(-50%) scale(0.28)',
              transformOrigin: 'top center',
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            <iframe
              src={`/api/preview/${site.id}`}
              sandbox="allow-scripts allow-same-origin"
              title={`preview-${site.id}`}
              loading="lazy"
              style={{
                width: '1280px',
                height: '900px',
                border: 'none',
              }}
            />
          </div>
        ) : site.status === 'generating' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Генерация...</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="h-10 w-10 text-brand-200" />
          </div>
        )}

        {/* Статус поверх превью */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={site.status} />
        </div>
      </div>

      {/* Инфо */}
      <div className="p-4 space-y-1">
        <p className="font-semibold text-gray-900 truncate">{masterName}</p>
        <p className="text-xs text-gray-400">
          Создан {formatDate(site.created_at)}
        </p>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 px-4 pb-4">
        <Link
          href={`/dashboard/preview/${site.id}`}
          className="btn-secondary text-xs py-1.5 flex-1 justify-center"
        >
          Открыть
        </Link>
        {site.status === 'draft' && (
          <Link
            href={`/dashboard/create?id=${site.id}`}
            className="btn-ghost text-xs py-1.5 flex-1 justify-center"
          >
            Редактировать
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-4">
        <Globe className="h-8 w-8 text-brand-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Создайте свой первый сайт
      </h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        Заполните анкету, загрузите фото работ — ИИ создаст красивый сайт за 2 минуты
      </p>
      <Link href="/dashboard/create" className="btn-primary inline-flex">
        <Plus className="h-4 w-4" />
        Создать сайт
      </Link>
    </div>
  )
}
