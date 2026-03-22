import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildPrompt, hashFormData } from '@/lib/promptBuilder'
import {
  extractHTML,
  validateHTML,
  sanitizeHTML,
  injectPhotos,
  addWatermark,
} from '@/lib/htmlUtils'
import { generateWithClaude, SYSTEM_PROMPT } from '@/lib/openrouter'
import { generateSubdomain } from '@/lib/utils'
import { generateSiteSchema, parseBody } from '@/lib/validation/schemas'
import type { WebsiteFormData } from '@/types'

const MAX_RETRIES = 3

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

    // 2. Парсим и валидируем тело запроса
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
    }

    const { data: parsed, error: validationError } = parseBody(generateSiteSchema, rawBody)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const formData: WebsiteFormData = parsed.formData as WebsiteFormData
    const websiteId: string | null = parsed.websiteId ?? null

    // 3. Получаем профиль — с fallback на trial если RLS не пускает
    let subscriptionStatus = 'trial'
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      if (profile?.subscription_status) {
        subscriptionStatus = profile.subscription_status
      }
    } catch (e) {
      console.warn('[generate-site] Could not fetch profile, using trial:', e)
    }

    // 4. Rate limit для демо
    if (subscriptionStatus === 'trial') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('generation_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          {
            error: 'Достигнут дневной лимит генераций (3 в сутки). Перейдите на платный тариф.',
            code: 'RATE_LIMIT',
          },
          { status: 429 }
        )
      }
    }

    // 5. Проверяем кэш
    const dataHash = hashFormData(formData)

    if (websiteId) {
      const { data: existing } = await supabase
        .from('websites')
        .select('id, generated_code, data_hash')
        .eq('id', websiteId)
        .eq('user_id', user.id)
        .single()

      if (existing?.data_hash === dataHash && existing?.generated_code) {
        console.log('[generate-site] Returning cached result')
        return NextResponse.json({
          websiteId: existing.id,
          html: existing.generated_code,
          cached: true,
        })
      }
    }

    // 6. Создаём или обновляем сайт в БД
    let siteId = websiteId

    if (!siteId) {
      const baseSubdomain = generateSubdomain(formData.master_name)
      let subdomain = baseSubdomain

      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase
          .from('websites')
          .select('id')
          .eq('subdomain', subdomain)
          .maybeSingle()

        if (!existing) break
        subdomain = `${baseSubdomain}${i + 1}`
      }

      const { data: newSite, error: createError } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          subdomain,
          status: 'draft',
          meta_data: formData,
          data_hash: dataHash,
        })
        .select('id')
        .single()

      if (createError || !newSite) {
        console.error('[generate-site] Create site error:', createError)
        return NextResponse.json(
          { error: 'Не удалось создать сайт в БД' },
          { status: 500 }
        )
      }

      siteId = newSite.id
      console.log('[generate-site] Created site:', siteId)
    } else {
      await supabase
        .from('websites')
        .update({ meta_data: formData, data_hash: dataHash })
        .eq('id', siteId)
        .eq('user_id', user.id)
    }

    // 7. Строим промпт
    const prompt = buildPrompt(formData)
    console.log('[generate-site] Prompt length:', prompt.length)

    // 8. Генерация с retry
    let generatedHTML = ''
    let tokensUsed = 0

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[generate-site] Attempt ${attempt}/${MAX_RETRIES}`)

      const { data: logEntry } = await supabase
        .from('generation_logs')
        .insert({
          website_id: siteId,
          prompt_used: prompt,
          status: 'pending',
          attempt_number: attempt,
        })
        .select('id')
        .single()

      const logId = logEntry?.id

      try {
        const currentPrompt =
          attempt > 1
            ? `${prompt}\n\nВАЖНО: Предыдущая попытка вернула некорректный HTML. Ответ должен начинаться строго с <!DOCTYPE html> и заканчиваться </html>.`
            : prompt

        const result = await generateWithClaude(currentPrompt, SYSTEM_PROMPT)
        tokensUsed = result.tokensUsed
        console.log(`[generate-site] Got response, tokens: ${tokensUsed}, length: ${result.content.length}`)

        const extracted = extractHTML(result.content)
        const isValid = validateHTML(extracted)
        console.log(`[generate-site] HTML valid: ${isValid}`)

        if (!isValid) {
          await supabase
            .from('generation_logs')
            .update({ raw_response: result.content.slice(0, 5000), status: 'failed', tokens_used: tokensUsed, error_message: 'Invalid HTML' })
            .eq('id', logId)
          continue
        }

        generatedHTML = extracted

        await supabase
          .from('generation_logs')
          .update({ raw_response: result.content.slice(0, 5000), status: 'success', tokens_used: tokensUsed })
          .eq('id', logId)

        break
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[generate-site] Generation error (attempt ${attempt}):`, msg)

        await supabase
          .from('generation_logs')
          .update({ status: 'failed', error_message: msg })
          .eq('id', logId)

        if (attempt === MAX_RETRIES) {
          return NextResponse.json(
            { error: `Ошибка обращения к AI: ${msg}` },
            { status: 500 }
          )
        }
      }
    }

    if (!generatedHTML) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать корректный HTML после 3 попыток' },
        { status: 500 }
      )
    }

    // 9. Постобработка
    let finalHTML = sanitizeHTML(generatedHTML)

    if (formData.photo_urls && formData.photo_urls.length > 0) {
      finalHTML = injectPhotos(finalHTML, formData.photo_urls)
    }

    if (subscriptionStatus === 'trial') {
      finalHTML = addWatermark(finalHTML)
    }

    // 10. Сохраняем
    await supabase
      .from('websites')
      .update({
        generated_code: finalHTML,
        prompt_used: prompt,
        status: 'demo',
      })
      .eq('id', siteId)

    console.log('[generate-site] Done, siteId:', siteId)

    return NextResponse.json({
      websiteId: siteId,
      html: finalHTML,
      tokensUsed,
      cached: false,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-site] Unhandled error:', msg)
    return NextResponse.json(
      { error: `Внутренняя ошибка сервера: ${msg}` },
      { status: 500 }
    )
  }
}
