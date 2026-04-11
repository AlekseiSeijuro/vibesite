import { createAdminClient } from '@/lib/supabase/server'
import { buildPrompt } from '@/lib/promptBuilder'
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
import type { WebsiteFormData } from '@/types'

const MAX_RETRIES = 3

/**
 * Фоновая генерация сайта.
 * Вызывается после того, как API уже ответил клиенту.
 * Использует adminClient чтобы не зависеть от сессии пользователя.
 */
export async function processGeneration(params: {
  siteId: string
  userId: string
  formData: WebsiteFormData
  subscriptionStatus: string
}) {
  const { siteId, userId, formData, subscriptionStatus } = params

  // Используем adminClient — сессия пользователя может быть уже закрыта
  const supabase = await createAdminClient()

  // Устанавливаем статус generating
  await supabase
    .from('websites')
    .update({ status: 'generating' })
    .eq('id', siteId)

  const prompt = buildPrompt(formData)
  console.log('[process-generation] Start, siteId:', siteId, 'prompt length:', prompt.length)

  let generatedHTML = ''
  let tokensUsed = 0

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[process-generation] Attempt ${attempt}/${MAX_RETRIES}`)

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
      console.log(`[process-generation] Got response, tokens: ${tokensUsed}, length: ${result.content.length}`)

      const extracted = extractHTML(result.content)
      const isValid = validateHTML(extracted)
      console.log(`[process-generation] HTML valid: ${isValid}`)

      if (!isValid) {
        await supabase
          .from('generation_logs')
          .update({
            raw_response: result.content.slice(0, 5000),
            status: 'failed',
            tokens_used: tokensUsed,
            error_message: 'Invalid HTML',
          })
          .eq('id', logId)
        continue
      }

      generatedHTML = extracted

      await supabase
        .from('generation_logs')
        .update({
          raw_response: result.content.slice(0, 5000),
          status: 'success',
          tokens_used: tokensUsed,
        })
        .eq('id', logId)

      break
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[process-generation] Error (attempt ${attempt}):`, msg)

      await supabase
        .from('generation_logs')
        .update({ status: 'failed', error_message: msg })
        .eq('id', logId)
    }
  }

  // Генерация не удалась — помечаем сайт как draft с ошибкой
  if (!generatedHTML) {
    console.error('[process-generation] All attempts failed, siteId:', siteId)
    await supabase
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

  // Сохраняем — статус меняется на demo, фронтенд поймает через Realtime
  await supabase
    .from('websites')
    .update({
      generated_code: finalHTML,
      prompt_used: prompt,
      status: 'demo',
    })
    .eq('id', siteId)

  console.log('[process-generation] Done, siteId:', siteId)
}
