import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildPrompt, hashFormData } from '@/lib/promptBuilder'
import {
  extractHTML,
  validateHTML,
  sanitizeHTML,
  injectPhotos,
  addWatermark,
  injectDomainLock,
  minifyHTML,
} from '@/lib/htmlUtils'
import { generateWithClaude, SYSTEM_PROMPT } from '@/lib/openrouter'
import { generateSubdomain } from '@/lib/utils'
import { generateSiteSchema, parseBody } from '@/lib/validation/schemas'
import type { WebsiteFormData } from '@/types'
import { validateAllFormFields, sanitizeFormField } from '@/lib/promptSafety'
import { createAdminClient } from '@/lib/supabase/server'

const MAX_RETRIES = 3
export const maxDuration = 120

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

    const parseResult = parseBody(generateSiteSchema, rawBody)
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error }, { status: 400 })
    }

    const formData: WebsiteFormData = parseResult.data.formData as WebsiteFormData
    const websiteId: string | null = parseResult.data.websiteId ?? null

    // 2.1. Валидация всех текстовых полей на injection и вредоносный контент
    const formValidation = validateAllFormFields(formData)
    if (!formValidation.valid) {
      return NextResponse.json(
        { error: formValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // 2.2. Санитизация всех текстовых полей
    formData.master_name = sanitizeFormField(formData.master_name)
    if (formData.studio_name) formData.studio_name = sanitizeFormField(formData.studio_name)
    formData.city = sanitizeFormField(formData.city)
    if (formData.address) formData.address = sanitizeFormField(formData.address)
    if (formData.style_notes) formData.style_notes = sanitizeFormField(formData.style_notes)
    if (formData.services) {
      formData.services = formData.services.map(s => ({
        ...s,
        name: sanitizeFormField(s.name),
        price: sanitizeFormField(s.price),
        description: s.description ? sanitizeFormField(s.description) : s.description,
      }))
    }

    // 3. Получаем профиль
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

    // 4. Лимит сайтов для демо — не более 1
    if (subscriptionStatus === 'trial' && !websiteId) {
      const { count } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'archived')

      if ((count ?? 0) >= 1) {
        return NextResponse.json(
          {
            error: 'На демо-тарифе можно создать только 1 сайт. Перейдите на платный тариф для создания новых сайтов.',
            code: 'SITE_LIMIT',
          },
          { status: 429 }
        )
      }
    }

    // 4.1. Лимит генераций в сутки
    const DAILY_LIMIT = subscriptionStatus === 'active' ? 7 : 3
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: userSites } = await supabase
      .from('websites')
      .select('id')
      .eq('user_id', user.id)

    const userSiteIds = userSites?.map(w => w.id) ?? []

    let generationsToday = 0
    if (userSiteIds.length > 0) {
      const { count } = await supabase
        .from('generation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('attempt_number', 1)
        .eq('status', 'success')
        .gte('created_at', twentyFourHoursAgo)
        .in('website_id', userSiteIds)

      generationsToday = count ?? 0
    }

    if (generationsToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Достигнут лимит генераций: ${DAILY_LIMIT} в сутки. Попробуйте позже.`,
          code: 'GENERATION_LIMIT',
          limit: DAILY_LIMIT,
          used: generationsToday,
        },
        { status: 429 }
      )
    }

    // 5. Проверяем кэш
    const dataHash = hashFormData(formData)

    if (websiteId) {
      const { data: existing } = await supabase
        .from('websites')
        .select('id, generated_code, data_hash, status')
        .eq('id', websiteId)
        .eq('user_id', user.id)
        .single()

      if (existing?.data_hash === dataHash && existing?.generated_code) {
        console.log('[generate-site] Returning cached result')
        return NextResponse.json({
          websiteId: existing.id,
          status: existing.status,
          cached: true,
        })
      }

      if (existing?.status === 'generating') {
        return NextResponse.json({
          websiteId: existing.id,
          status: 'generating',
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
          status: 'generating',
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
        .update({ meta_data: formData, data_hash: dataHash, status: 'generating' })
        .eq('id', siteId)
        .eq('user_id', user.id)
    }

    // ── БЫСТРЫЙ ОТВЕТ ──
    // Отвечаем клиенту сразу — он подпишется на Realtime и увидит результат
    // Генерация продолжается в этом же запросе ниже (Vercel ждёт maxDuration)
    //
    // Используем streaming response — отправляем JSON сразу,
    // а генерация продолжается пока stream открыт
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    // Отправляем начальный ответ
    const initialResponse = JSON.stringify({
      websiteId: siteId,
      status: 'generating',
    })
    writer.write(encoder.encode(initialResponse))

    // Запускаем генерацию в фоне этого же запроса
    const adminSupabase = await createAdminClient()

    const generateInBackground = async () => {
      try {
        const prompt = buildPrompt(formData)
        console.log('[generate-site] Prompt length:', prompt.length)

        let generatedHTML = ''
        let tokensUsed = 0

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          console.log(`[generate-site] Attempt ${attempt}/${MAX_RETRIES}`)

          const { data: logEntry } = await adminSupabase
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
              await adminSupabase
                .from('generation_logs')
                .update({ raw_response: result.content.slice(0, 5000), status: 'failed', tokens_used: tokensUsed, error_message: 'Invalid HTML' })
                .eq('id', logId)
              continue
            }

            generatedHTML = extracted

            await adminSupabase
              .from('generation_logs')
              .update({ raw_response: result.content.slice(0, 5000), status: 'success', tokens_used: tokensUsed })
              .eq('id', logId)

            break
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            console.error(`[generate-site] Generation error (attempt ${attempt}):`, msg)

            await adminSupabase
              .from('generation_logs')
              .update({ status: 'failed', error_message: msg })
              .eq('id', logId)
          }
        }

        if (!generatedHTML) {
          console.error('[generate-site] All attempts failed')
          await adminSupabase
            .from('websites')
            .update({ status: 'draft' })
            .eq('id', siteId)
          return
        }

        // Постобработка
        let finalHTML = sanitizeHTML(generatedHTML)

        if (formData.photo_urls && formData.photo_urls.length > 0) {
          finalHTML = injectPhotos(finalHTML, formData.photo_urls)
        }

        if (subscriptionStatus === 'trial') {
          finalHTML = addWatermark(finalHTML)
        }

        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'beauty-site.ru'
        finalHTML = injectDomainLock(finalHTML, appDomain)
        finalHTML = minifyHTML(finalHTML)

        // Сохраняем — Realtime оповестит клиента
        await adminSupabase
          .from('websites')
          .update({
            generated_code: finalHTML,
            prompt_used: prompt,
            status: 'demo',
          })
          .eq('id', siteId)

        console.log('[generate-site] Done, siteId:', siteId)
      } catch (e) {
        console.error('[generate-site] Background error:', e)
        await adminSupabase
          .from('websites')
          .update({ status: 'draft' })
          .eq('id', siteId)
      } finally {
        writer.close()
      }
    }

    generateInBackground()

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
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
