import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyWebhookPayment } from '@/lib/yookassa/client'
import { getPlanEndDate, PLAN_CONFIGS } from '@/lib/yookassa/plans'
import { addWatermark } from '@/lib/htmlUtils'

/**
 * Webhook от ЮKassa
 *
 * Как настроить:
 * 1. Войти в личный кабинет ЮKassa
 * 2. Настройки → Уведомления → HTTP-уведомления
 * 3. Указать URL: https://твой-домен.ru/api/payments/webhook
 * 4. Выбрать события: payment.succeeded, payment.canceled
 *
 * ЮKassa не подписывает уведомления — поэтому мы перепроверяем
 * платёж через API перед обновлением БД (защита от подделки)
 */
export async function POST(request: Request) {
  let body: { event: string; object: { id: string } }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, object: paymentObject } = body

  console.log('[webhook] Event:', event, 'Payment:', paymentObject?.id)

  // Нас интересует только успешный платёж
  if (event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = paymentObject?.id
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
  }

  // Перепроверяем платёж через API ЮKassa (защита от подделки)
  let payment
  try {
    payment = await verifyWebhookPayment(paymentId)
  } catch (e) {
    console.error('[webhook] Failed to verify payment:', e)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }

  if (payment.status !== 'succeeded') {
    console.log('[webhook] Payment not succeeded, ignoring')
    return NextResponse.json({ ok: true })
  }

  // Извлекаем метаданные
  const { userId, websiteId, planKey, planSlug } = payment.metadata ?? {}

  if (!userId || !websiteId || !planKey) {
    console.error('[webhook] Missing metadata:', payment.metadata)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    const plan = PLAN_CONFIGS[planKey]
    const endDate = getPlanEndDate(planKey)
    const amount = Math.round(parseFloat(payment.amount.value))

    // 1. Обновляем статус пользователя
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_ends_at: endDate?.toISOString() ?? null,
      })
      .eq('id', userId)

    // 2. Обновляем сайт
    await supabase
      .from('websites')
      .update({ subscription_plan: planSlug ?? plan.slug })
      .eq('id', websiteId)

    // 3. Убираем watermark из сгенерированного кода
    const { data: site } = await supabase
      .from('websites')
      .select('generated_code')
      .eq('id', websiteId)
      .single()

    if (site?.generated_code) {
      // Удаляем watermark-блок из HTML
      const cleanHTML = site.generated_code.replace(
        /<div[^>]*position:fixed[^>]*>[\s\S]*?Создано на Vibesite[\s\S]*?<\/div>/gi,
        ''
      )
      await supabase
        .from('websites')
        .update({ generated_code: cleanHTML })
        .eq('id', websiteId)
    }

    // 4. Создаём запись подписки
    await supabase.from('subscriptions').insert({
      user_id: userId,
      website_id: websiteId,
      plan: planSlug ?? plan.slug,
      start_date: new Date().toISOString(),
      end_date: endDate?.toISOString() ?? null,
      amount,
      payment_id: paymentId,
    })

    console.log('[webhook] Payment processed successfully:', paymentId)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[webhook] Processing error:', msg)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
