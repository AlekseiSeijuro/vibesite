import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createPayment, isYookassaConfigured } from '@/lib/yookassa/client'
import { getPlanAmount, PLAN_CONFIGS } from '@/lib/yookassa/plans'

export async function POST(request: Request) {
  if (!isYookassaConfigured()) {
    return NextResponse.json(
      {
        error: 'Платёжная система временно недоступна. Попробуйте позже.',
        code: 'YOOKASSA_NOT_CONFIGURED',
      },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let planKey: string

  try {
    const body = await request.json()
    planKey = body.planKey
    if (!planKey) throw new Error('Missing planKey')
    if (!PLAN_CONFIGS[planKey]) throw new Error('Invalid plan')
  } catch {
    return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
  }

  const amount = getPlanAmount(planKey)
  const plan = PLAN_CONFIGS[planKey]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const payment = await createPayment({
      amount,
      description: `Vibesite — ${plan.name}`,
      returnUrl: `${appUrl}/dashboard/billing?payment_status=success`,
      metadata: {
        userId: user.id,
        planKey,
        planSlug: plan.slug,
      },
    })

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
      amount,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[payments/create] Error:', msg)
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
