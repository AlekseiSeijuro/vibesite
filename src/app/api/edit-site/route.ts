import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateEditMessage } from '@/lib/promptSafety'
import { track } from '@/lib/analytics'

const EDIT_COST = 49

export async function POST(request: Request) {
  try {
    // 1. Авторизация
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Парсим тело запроса
    let websiteId: string
    let userMessage: string

    try {
      const body = await request.json()
      websiteId = body.websiteId
      userMessage = body.userMessage?.trim()
      if (!websiteId || !userMessage) throw new Error('Missing fields')

      const validation = validateEditMessage(userMessage)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, code: 'INVALID_MESSAGE' },
          { status: 400 }
        )
      }
      userMessage = validation.sanitized!
    } catch {
      return NextResponse.json(
        { error: 'Некорректные данные запроса' },
        { status: 400 }
      )
    }

    // 3. Атомарное списание баланса
    const { data: newBalance, error: deductError } = await supabase.rpc(
      'deduct_edit_balance',
      { p_user_id: user.id, p_amount: EDIT_COST }
    )

    if (deductError) {
      console.error('[edit-site] deduct_edit_balance error:', deductError)
      return NextResponse.json({ error: 'Ошибка списания баланса' }, { status: 500 })
    }

    if (newBalance === -1) {
      const { data: profile } = await supabase
        .from('users')
        .select('edit_balance')
        .eq('id', user.id)
        .single()

      return NextResponse.json(
        {
          error: `Недостаточно средств. Для правки нужно ${EDIT_COST} ₽, на балансе ${profile?.edit_balance ?? 0} ₽.`,
          code: 'INSUFFICIENT_BALANCE',
          balance: profile?.edit_balance ?? 0,
          required: EDIT_COST,
        },
        { status: 402 }
      )
    }

    // 4. Получаем сайт
    const { data: site } = await supabase
      .from('websites')
      .select('id, generated_code, status')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single()

    if (!site || !site.generated_code) {
      await supabase.rpc('topup_edit_balance', { p_user_id: user.id, p_amount: EDIT_COST })
      return NextResponse.json(
        { error: site ? 'У сайта нет сгенерированного кода' : 'Сайт не найден' },
        { status: site ? 400 : 404 }
      )
    }

    // 5. Создаём запись лога
    const { data: logEntry } = await supabase
      .from('edit_logs')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        user_message: userMessage,
        html_before: site.generated_code,
        status: 'pending',
        amount_charged: EDIT_COST,
      })
      .select('id')
      .single()

    // 6. Отправляем задачу на worker
    const workerUrl = process.env.WORKER_URL
    const workerSecret = process.env.WORKER_SECRET

    if (!workerUrl) {
      await supabase.rpc('topup_edit_balance', { p_user_id: user.id, p_amount: EDIT_COST })
      return NextResponse.json({ error: 'Сервер редактирования не настроен' }, { status: 500 })
    }

    try {
      await fetch(`${workerUrl}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workerSecret ?? ''}`,
        },
        body: JSON.stringify({
          siteId: websiteId,
          editLogId: logEntry?.id ?? null,
          userId: user.id,
          userMessage,
          htmlBefore: site.generated_code,
          editCost: EDIT_COST,
        }),
      })
    } catch (e) {
      console.error('[edit-site] Failed to reach worker:', e)
      await supabase.rpc('topup_edit_balance', { p_user_id: user.id, p_amount: EDIT_COST })
      return NextResponse.json(
        { error: 'Сервер редактирования временно недоступен.' },
        { status: 503 }
      )
    }

    // 7. Отвечаем клиенту — правка в процессе
    await track('site_edit_requested', { website_id: websiteId })

    return NextResponse.json({
      success: true,
      status: 'processing',
      newBalance: newBalance as number,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[edit-site] Unhandled error:', msg)
    return NextResponse.json({ error: `Внутренняя ошибка сервера: ${msg}` }, { status: 500 })
  }
}
