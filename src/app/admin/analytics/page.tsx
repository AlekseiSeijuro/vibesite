import { createAdminClient } from '@/lib/supabase/server'
import { BarChart2, TrendingUp, Users, Zap } from 'lucide-react'

interface FunnelRow { step: number; sessions: number }
interface ConversionRow { generated: number; paid: number; conversion_pct: number }
interface AiDayRow { day: string; generations: number; edits: number }
interface DauRow { day: string; dau: number }

export default async function AnalyticsPage() {
  const supabase = await createAdminClient()

  // ── 1. Воронка создания сайта (30 дней) ──────────────────────────────────
  const { data: funnelRaw } = await supabase
    .from('analytics_events')
    .select('properties, user_id')
    .eq('event_name', 'wizard_step_completed')
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())

  const funnelMap: Record<number, Set<string>> = {}
  for (const row of funnelRaw ?? []) {
    const step = (row.properties as any)?.step as number
    // Считаем по user_id если авторизован, иначе по session_id
    const uid = row.user_id ?? (row.properties as any)?.session_id ?? 'x'
    if (step >= 1 && step <= 6) {
      if (!funnelMap[step]) funnelMap[step] = new Set()
      funnelMap[step].add(uid)
    }
  }
  const funnel: FunnelRow[] = [1, 2, 3, 4, 5, 6].map((step) => ({
    step,
    sessions: funnelMap[step]?.size ?? 0,
  }))

  // ── 2. Конверсия (30 дней) ────────────────────────────────────────────────
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const { count: generationsCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'site_generated')
    .gte('created_at', since30)

  const { data: paidUsers } = await supabase
    .from('analytics_events')
    .select('user_id')
    .eq('event_name', 'payment_success')
    .gte('created_at', since30)
    .not('user_id', 'is', null)

  const generatedCount = generationsCount ?? 0
  const paidCount = new Set(paidUsers?.map((r) => r.user_id)).size
  const convPct = generatedCount > 0 ? Math.round((paidCount / generatedCount) * 100 * 10) / 10 : 0

  const conv: ConversionRow = { generated: generatedCount, paid: paidCount, conversion_pct: convPct }

  // ── 3. AI по дням (14 дней) ───────────────────────────────────────────────
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString()
  const { data: aiRaw } = await supabase
    .from('analytics_events')
    .select('event_name, created_at')
    .in('event_name', ['site_generated', 'site_edit_requested'])
    .gte('created_at', since14)

  const aiMap: Record<string, { generations: number; edits: number }> = {}
  for (const row of aiRaw ?? []) {
    const day = row.created_at.slice(0, 10)
    if (!aiMap[day]) aiMap[day] = { generations: 0, edits: 0 }
    if (row.event_name === 'site_generated') aiMap[day].generations++
    else aiMap[day].edits++
  }
  const aiDays: AiDayRow[] = Object.entries(aiMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }))

  // ── 4. DAU (7 дней) ───────────────────────────────────────────────────────
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: dauRaw } = await supabase
    .from('analytics_events')
    .select('user_id, created_at')
    .gte('created_at', since7)
    .not('user_id', 'is', null)

  const dauMap: Record<string, Set<string>> = {}
  for (const row of dauRaw ?? []) {
    const day = row.created_at.slice(0, 10)
    if (!dauMap[day]) dauMap[day] = new Set()
    dauMap[day].add(row.user_id)
  }
  const dauDays: DauRow[] = Object.entries(dauMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, set]) => ({ day, dau: set.size }))

  // ── 5. MAU ────────────────────────────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: mauRaw } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', startOfMonth.toISOString())
    .not('user_id', 'is', null)

  const mau = new Set(mauRaw?.map((r) => r.user_id)).size

  const STEP_LABELS: Record<number, string> = {
    1: 'Ниша', 2: 'Информация', 3: 'Контакты',
    4: 'Услуги', 5: 'Стиль', 6: 'Фото / Запуск',
  }

  const maxFunnel = funnel[0]?.sessions ?? 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        <p className="text-sm text-gray-500 mt-1">Данные за последние 30 дней, если не указано иное</p>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Zap className="h-5 w-5 text-brand-600" />}
          label="Генераций (30 дн.)"
          value={conv.generated}
          bg="bg-brand-50"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          label="Оплат (30 дн.)"
          value={conv.paid}
          bg="bg-green-50"
        />
        <KpiCard
          icon={<BarChart2 className="h-5 w-5 text-purple-600" />}
          label="Конверсия"
          value={`${conv.conversion_pct}%`}
          bg="bg-purple-50"
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-orange-600" />}
          label="MAU (мес.)"
          value={mau}
          bg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Воронка */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Воронка создания сайта (30 дн.)</h2>
          {funnel.every((r) => r.sessions === 0) ? (
            <p className="text-sm text-gray-400">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {funnel.map((row) => {
                const pct = maxFunnel ? Math.round((row.sessions / maxFunnel) * 100) : 0
                const prev = funnel.find((r) => r.step === row.step - 1)
                const drop = prev && prev.sessions > 0
                  ? Math.round(((prev.sessions - row.sessions) / prev.sessions) * 100)
                  : 0

                return (
                  <div key={row.step}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Шаг {row.step} — {STEP_LABELS[row.step]}</span>
                      <span className="flex gap-2 items-center">
                        {row.step > 1 && drop > 0 && (
                          <span className="text-red-400">−{drop}%</span>
                        )}
                        <span className="font-medium text-gray-700">{row.sessions.toLocaleString('ru')}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* DAU */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">DAU (последние 7 дней)</h2>
          {dauDays.length === 0 ? (
            <p className="text-sm text-gray-400">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {dauDays.map((row) => {
                const maxDau = Math.max(...dauDays.map((r) => r.dau), 1)
                const pct = Math.round((row.dau / maxDau) * 100)
                const label = new Date(row.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                return (
                  <div key={row.day}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{label}</span>
                      <span className="font-medium text-gray-700">{row.dau}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI по дням */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">AI-активность (последние 14 дней)</h2>
        {aiDays.length === 0 ? (
          <p className="text-sm text-gray-400">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Дата</th>
                  <th className="pb-2 font-medium text-right">Генераций</th>
                  <th className="pb-2 font-medium text-right">Правок</th>
                </tr>
              </thead>
              <tbody>
                {aiDays.map((row) => (
                  <tr key={row.day} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">
                      {new Date(row.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right font-medium text-brand-600">{row.generations}</td>
                    <td className="py-2 text-right font-medium text-purple-600">{row.edits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
