import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createPayment, isYookassaConfigured } from '@/lib/yookassa/client'

// Пакеты пополнения баланса
export const TOPUP_PACKAGES = [
  { id: 'topup_5',  edits: 5,  amount: 245,  label: '5 правок' },
  { id: 'topup_10', edits: 10, amount: 490,  label: '10 правок' },
  { id: 'topup_20', edits: 20, amount: 980,  label: '20 правок' },
]

export async function POST(request: Request) {
  if (!isYookassaConfigured()) {
    return NextResponse.json(
      { error: 'Платёжная система временно недоступна.', code: 'YOOKASSA_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let packageId: string
  try {
    const body = await request.json()
    packageId = body.packageId
    if (!packageId) throw new Error('Missing packageId')
  } catch {
    return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
  }

  const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Неверный пакет пополнения' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const payment = await createPayment({
      amount: pkg.amount,
      description: `Vibesite — пополнение баланса AI-редактора: ${pkg.label}`,
      returnUrl: `${appUrl}/dashboard/billing?topup_status=success`,
      metadata: {
        userId: user.id,
        type: 'balance_topup',
        packageId: pkg.id,
        edits: pkg.edits,
        amount: pkg.amount,
      },
    })

    return NextResponse.json({
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
      amount: pkg.amount,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
