import { createClient } from '@/lib/supabase/client'

export type AnalyticsEvent =
  | 'wizard_step_completed'  // шаг мастера создания сайта
  | 'site_generated'          // AI сгенерировал сайт
  | 'site_published'          // сайт опубликован на поддомене
  | 'site_edit_requested'     // запрос AI-правки
  | 'payment_initiated'       // создан платёж в ЮKassa
  | 'payment_success'         // webhook: payment.succeeded
  | 'preview_opened'          // открыт предпросмотр
  | 'support_message_sent'    // отправлено сообщение в поддержку

export interface EventProps {
  step?: number          // 1–6 для wizard_step_completed
  niche?: string         // маникюр / брови / ресницы / ...
  style?: string         // laconic / friendly / premium
  website_id?: string
  subdomain?: string
  plan?: string          // demo / subdomain / custom_domain
  amount?: number        // сумма в рублях
  error?: string
  [key: string]: unknown
}

/**
 * Отправляет аналитическое событие:
 * 1. В Яндекс.Метрику (reachGoal) — только на клиенте
 * 2. В таблицу analytics_events в Supabase — всегда
 */
export async function track(event: AnalyticsEvent, props: EventProps = {}) {
  try {
    // 1. Яндекс.Метрика — только в браузере
    if (typeof window !== 'undefined' && (window as any).ym) {
      const ymId = process.env.NEXT_PUBLIC_YM_ID
      if (ymId) {
        ;(window as any).ym(Number(ymId), 'reachGoal', event, props)
      }
    }

    // 2. Supabase analytics_events
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('analytics_events').insert({
      user_id: user?.id ?? null,
      event_name: event,
      properties: props,
      session_id: getSessionId(),
    })
  } catch (e) {
    // Аналитика не должна ломать основной флоу
    console.warn('[analytics]', e)
  }
}

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return ''
  let sid = sessionStorage.getItem('vsid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('vsid', sid)
  }
  return sid
}
