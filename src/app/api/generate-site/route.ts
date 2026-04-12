import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildPrompt, hashFormData } from '@/lib/promptBuilder'
import { generateSubdomain } from '@/lib/utils'
import { generateSiteSchema, parseBody } from '@/lib/validation/schemas'
import type { WebsiteFormData } from '@/types'
import { validateAllFormFields, sanitizeFormField } from '@/lib/promptSafety'

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

    // 2.1. Валидация всех текстовых полей
    const formValidation = validateAllFormFields(formData)
    if (!formValidation.valid) {
      return NextResponse.json(
        { error: formValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // 2.2. Санитизация
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

    // 4. Лимит сайтов для демо
    if (subscriptionStatus === 'trial' && !websiteId) {
      const { count } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'archived')

      if ((count ?? 0) >= 1) {
        return NextResponse.json(
          { error: 'На демо-тарифе можно создать только 1 сайт.', code: 'SITE_LIMIT' },
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
        return NextResponse.json({ websiteId: existing.id, status: existing.status, cached: true })
      }

      if (existing?.status === 'generating') {
        return NextResponse.json({ websiteId: existing.id, status: 'generating' })
      }
    }

    // 6. Создаём или обновляем сайт
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
        return NextResponse.json({ error: 'Не удалось создать сайт в БД' }, { status: 500 })
      }

      siteId = newSite.id
    } else {
      await supabase
        .from('websites')
        .update({ meta_data: formData, data_hash: dataHash, status: 'generating' })
        .eq('id', siteId)
        .eq('user_id', user.id)
    }

    // 7. Строим промпт и отправляем задачу на VPS worker
    const prompt = buildPrompt(formData)

    const workerUrl = process.env.WORKER_URL
    const workerSecret = process.env.WORKER_SECRET

    if (!workerUrl) {
      console.error('[generate-site] WORKER_URL not set')
      return NextResponse.json({ error: 'Сервер генерации не настроен' }, { status: 500 })
    }

    try {
      const workerRes = await fetch(`${workerUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workerSecret ?? ''}`,
        },
        body: JSON.stringify({
          siteId,
          prompt,
          formData,
          subscriptionStatus,
        }),
      })

      if (!workerRes.ok) {
        const err = await workerRes.text()
        console.error('[generate-site] Worker error:', err)
        // Не фейлим — может worker временно недоступен
        // Статус уже generating, пользователь увидит ошибку через polling
      }
    } catch (e) {
      console.error('[generate-site] Failed to reach worker:', e)
      // Worker недоступен — откатываем статус
      await supabase
        .from('websites')
        .update({ status: 'draft' })
        .eq('id', siteId)

      return NextResponse.json(
        { error: 'Сервер генерации временно недоступен. Попробуйте позже.' },
        { status: 503 }
      )
    }

    // 8. Сразу отвечаем клиенту
    return NextResponse.json({
      websiteId: siteId,
      status: 'generating',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-site] Unhandled error:', msg)
    return NextResponse.json({ error: `Внутренняя ошибка сервера: ${msg}` }, { status: 500 })
  }
}
