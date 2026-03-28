import OpenAI from 'openai'

/**
 * RouterAI — российский роутер моделей, совместимый с OpenAI SDK.
 * Документация: https://routerai.ru/docs/guides/overview/quickstart
 */
export const openrouter = new OpenAI({
  baseURL: 'https://routerai.ru/api/v1',
  apiKey: process.env.ROUTERAI_API_KEY!,
})

// Модель берётся из env, с fallback на claude-sonnet-4-5
export const GENERATION_MODEL =
  process.env.ROUTERAI_MODEL ?? 'anthropic/claude-sonnet-4-5'

export async function generateWithClaude(
  prompt: string,
  systemPrompt: string
): Promise<{ content: string; tokensUsed: number }> {
  const completion = await openrouter.chat.completions.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })

  const content = completion.choices[0]?.message?.content ?? ''
  const tokensUsed =
    (completion.usage?.prompt_tokens ?? 0) +
    (completion.usage?.completion_tokens ?? 0)

  return { content, tokensUsed }
}

export const SYSTEM_PROMPT =
  'Ты — профессиональный frontend-разработчик и UI/UX дизайнер. ' +
  'Генерируй только валидный HTML5+CSS код без каких-либо пояснений. ' +
  'Ответ должен начинаться с <!DOCTYPE html> и заканчиваться </html>.'
