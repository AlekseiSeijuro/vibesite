import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyWebhookPayment } from '@/lib/yookassa/client'
import { getPlanEndDate, PLAN_CONFIGS } from '@/lib/yookassa/plans'

/**
 * Webhook от ЮKassa
 *
 * Как настроить:
 * 1. Войти в личный кабинет ЮKassa
 * 2. Настройки → Уведомления → HTTP-уведомления
 * 3. Указать URL: https://beauty-site.ru/api/payments/webhook
 * 4. Выбрать события: payment.succeeded, payment.canceled
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

  if (event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = paymentObject?.id
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
  }

  let payment
  try {
    payment = await verifyWebhookPayment(paymentId)
  } catch (e) {
    console.error('[webhook] Failed to verify payment:', e)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }

  if (payment.status !== 'succeeded') {
    return NextResponse.json({ ok: true })
  }

  const { userId, planKey, planSlug, type, edits } = payment.metadata ?? {}

  if (!userId) {
    console.error('[webhook] Missing userId in metadata:', payment.metadata)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Пополнение баланса AI-редактора
  if (type === 'balance_topup') {
    const editsCount = parseInt(edits ?? '0', 10)

    const { data: profile } = await supabase
      .from('users')
      .select('edit_balance')
      .eq('id', userId)
      .single()

    const newBalance = (profile?.edit_balance ?? 0) + editsCount * 49

    await supabase
      .from('users')
      .update({ edit_balance: newBalance })
      .eq('id', userId)

    console.log('[webhook] Balance topup:', userId, '+', editsCount * 49, '-> balance:', newBalance)
    return NextResponse.json({ ok: true })
  }

  // Оплата подписки — тариф применяется к аккаунту
  try {
    if (!planKey || !PLAN_CONFIGS[planKey]) {
      console.error('[webhook] Invalid planKey:', planKey)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = PLAN_CONFIGS[planKey]
    const endDate = getPlanEndDate(planKey)
    const amount = Math.round(parseFloat(payment.amount.value))

    // Обновляем статус подписки пользователя
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_ends_at: endDate?.toISOString() ?? null,
      })
      .eq('id', userId)

    // Убираем watermark со всех сайтов пользователя
    const { data: sites } = await supabase
      .from('websites')
      .select('id, generated_code')
      .eq('user_id', userId)
      .not('generated_code', 'is', null)

    if (sites && sites.length > 0) {
      for (const site of sites) {
        if (!site.generated_code) continue
        const cleanHTML = site.generated_code.replace(
          /<div[^>]*position:fixed[^>]*>[\s\S]*?Vibesite[\s\S]*?<\/div>/gi,
          ''
        )
        await supabase
          .from('websites')
          .update({ generated_code: cleanHTML })
          .eq('id', site.id)
      }
    }

    // Создаём запись подписки
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: planSlug ?? plan.slug,
      start_date: new Date().toISOString(),
      end_date: endDate?.toISOString() ?? null,
      amount,
      payment_id: paymentId,
    })

    console.log('[webhook] Subscription processed:', paymentId)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[webhook] Processing error:', msg)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
