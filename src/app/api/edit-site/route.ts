import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildEditPrompt } from '@/lib/promptBuilder'
import {
  extractHTML,
  validateHTML,
  sanitizeHTML,
  injectDomainLock,
  minifyHTML,
} from '@/lib/htmlUtils'
import { generateWithClaude } from '@/lib/openrouter'

const EDIT_COST = 49 // рублей за одну правку
const EDIT_SYSTEM_PROMPT =
  'Ты — профессиональный frontend-разработчик. ' +
  'Вносишь точечные правки в HTML-код сайта строго по запросу пользователя. ' +
  'Ответ должен начинаться с <!DOCTYPE html> и заканчиваться </html>. ' +
  'Никакого текста, пояснений или markdown до или после HTML.'

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
    } catch {
      return NextResponse.json(
        { error: 'Некорректные данные запроса' },
        { status: 400 }
      )
    }

    // 3. Получаем профиль пользователя и проверяем баланс
    const { data: profile } = await supabase
      .from('users')
      .select('edit_balance')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль пользователя не найден' },
        { status: 404 }
      )
    }

    if ((profile.edit_balance ?? 0) < EDIT_COST) {
      return NextResponse.json(
        {
          error: `Недостаточно средств. Для правки нужно ${EDIT_COST} ₽, на балансе ${profile.edit_balance ?? 0} ₽.`,
          code: 'INSUFFICIENT_BALANCE',
          balance: profile.edit_balance ?? 0,
          required: EDIT_COST,
        },
        { status: 402 }
      )
    }

    // 4. Получаем сайт — проверяем владельца и наличие HTML
    const { data: site } = await supabase
      .from('websites')
      .select('id, generated_code, status')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single()

    if (!site) {
      return NextResponse.json(
        { error: 'Сайт не найден' },
        { status: 404 }
      )
    }

    if (!site.generated_code) {
      return NextResponse.json(
        { error: 'У сайта нет сгенерированного кода' },
        { status: 400 }
      )
    }

    const htmlBefore = site.generated_code

    // 5. Создаём запись лога со статусом pending
    const { data: logEntry } = await supabase
      .from('edit_logs')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        user_message: userMessage,
        html_before: htmlBefore,
        status: 'pending',
        amount_charged: EDIT_COST,
      })
      .select('id')
      .single()

    const logId = logEntry?.id

    // 6. Строим промпт и вызываем модель
    const prompt = buildEditPrompt(htmlBefore, userMessage)

    let rawContent: string
    let tokensUsed: number

    try {
      const result = await generateWithClaude(prompt, EDIT_SYSTEM_PROMPT)
      rawContent = result.content
      tokensUsed = result.tokensUsed
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[edit-site] AI error:', msg)

      // Обновляем лог — ошибка генерации
      if (logId) {
        await supabase
          .from('edit_logs')
          .update({ status: 'failed', error_message: `AI error: ${msg}` })
          .eq('id', logId)
      }

      return NextResponse.json(
        { error: `Ошибка обращения к AI: ${msg}` },
        { status: 500 }
      )
    }

    // 7. Извлекаем и валидируем HTML
    const extracted = extractHTML(rawContent)
    const isValid = validateHTML(extracted)

    if (!isValid) {
      console.error('[edit-site] Invalid HTML from AI')

      if (logId) {
        await supabase
          .from('edit_logs')
          .update({
            status: 'failed',
            tokens_used: tokensUsed,
            error_message: 'AI вернул невалидный HTML',
          })
          .eq('id', logId)
      }

      return NextResponse.json(
        { error: 'Модель вернула некорректный HTML. Попробуйте переформулировать запрос.' },
        { status: 500 }
      )
    }

    // 8. Постобработка — те же шаги что при генерации
    let finalHTML = sanitizeHTML(extracted)

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'beauty-site.ru'
    finalHTML = injectDomainLock(finalHTML, appDomain)
    finalHTML = minifyHTML(finalHTML)

    // 9. Сохраняем новый HTML в websites
    const { error: updateError } = await supabase
      .from('websites')
      .update({ generated_code: finalHTML })
      .eq('id', websiteId)

    if (updateError) {
      console.error('[edit-site] DB update error:', updateError)

      if (logId) {
        await supabase
          .from('edit_logs')
          .update({
            status: 'failed',
            tokens_used: tokensUsed,
            error_message: `DB error: ${updateError.message}`,
          })
          .eq('id', logId)
      }

      return NextResponse.json(
        { error: 'Ошибка сохранения изменений' },
        { status: 500 }
      )
    }

    // 10. Списываем с баланса и обновляем лог — всё прошло успешно
    await Promise.all([
      supabase
        .from('users')
        .update({ edit_balance: (profile.edit_balance ?? 0) - EDIT_COST })
        .eq('id', user.id),

      logId
        ? supabase
            .from('edit_logs')
            .update({
              html_after: finalHTML,
              tokens_used: tokensUsed,
              status: 'success',
            })
            .eq('id', logId)
        : Promise.resolve(),
    ])

    console.log('[edit-site] Done, websiteId:', websiteId, 'tokens:', tokensUsed)

    return NextResponse.json({
      success: true,
      newBalance: (profile.edit_balance ?? 0) - EDIT_COST,
      tokensUsed,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[edit-site] Unhandled error:', msg)
    return NextResponse.json(
      { error: `Внутренняя ошибка сервера: ${msg}` },
      { status: 500 }
    )
  }
}
