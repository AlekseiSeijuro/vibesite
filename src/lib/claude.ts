import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GenerateOptions {
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface GenerateResult {
  html: string
  tokensUsed: number
  rawResponse: string
}

const SYSTEM_PROMPT = `Ты — эксперт по frontend-разработке и UI/UX дизайну. 
Твоя единственная задача — генерировать красивый, современный, полностью валидный HTML5 код одностраничного сайта.
Правила:
- Возвращай ТОЛЬКО HTML код, начиная с <!DOCTYPE html>
- Весь CSS встроен в тег <style> внутри <head>
- Никаких внешних зависимостей кроме системных шрифтов
- Адаптивная верстка (mobile-first)
- Никаких пояснений, комментариев вне кода, markdown-обёрток
- Код должен быть полным и готовым к отображению`

export async function generateSiteHTML(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, maxTokens = 8000 } = options

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawResponse = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  const html = extractHTML(rawResponse)
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

  return { html, tokensUsed, rawResponse }
}

function extractHTML(raw: string): string {
  // Убираем markdown-обёртки если есть
  const cleaned = raw
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // Находим полный HTML документ
  const match = cleaned.match(/<!DOCTYPE html>[\s\S]*/i)
  if (match) return match[0]

  // Если нет DOCTYPE — ищем <html>
  const htmlMatch = cleaned.match(/<html[\s\S]*/i)
  if (htmlMatch) return `<!DOCTYPE html>\n${htmlMatch[0]}`

  return cleaned
}

export function isValidHTML(html: string): boolean {
  return (
    html.includes('<html') &&
    html.includes('<body') &&
    html.includes('</html>')
  )
}
