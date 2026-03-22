/**
 * Извлекает чистый HTML из ответа Claude.
 * Claude иногда оборачивает код в ```html ... ``` или добавляет пояснения.
 */
export function extractHTML(raw: string): string {
  // Убираем markdown-блоки ```html ... ``` или ``` ... ```
  const fenceMatch = raw.match(/```(?:html)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Если ответ начинается с <!DOCTYPE или <html — берём как есть
  const trimmed = raw.trim()
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return trimmed
  }

  // Ищем HTML внутри текста
  const htmlMatch = raw.match(/(<!DOCTYPE[\s\S]*<\/html>)/i)
  if (htmlMatch) return htmlMatch[1].trim()

  return trimmed
}

/**
 * Проверяет что строка является базовым HTML-документом.
 */
export function isValidHTML(html: string): boolean {
  const lower = html.toLowerCase()
  return (
    lower.includes('<html') &&
    lower.includes('<body') &&
    lower.includes('</html>')
  )
}

/**
 * Санитизирует HTML: убирает потенциально опасные конструкции.
 * Разрешены встроенные стили, ссылки на wa.me / t.me / tel: / mailto:
 */
export function sanitizeHTML(html: string): string {
  let result = html

  // Убираем <script> с внешними источниками (src=...)
  result = result.replace(
    /<script[^>]+src=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  )

  // Убираем inline обработчики с eval или опасными вызовами
  result = result.replace(/\bon\w+\s*=\s*["'][^"']*eval[^"']*["']/gi, '')
  result = result.replace(/\bon\w+\s*=\s*["'][^"']*document\.write[^"']*["']/gi, '')

  // Убираем <meta http-equiv="refresh"> (редиректы)
  result = result.replace(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/gi, '')

  return result
}

/**
 * Вставляет водяной знак в конец <body>.
 */
export function injectWatermark(html: string, appUrl: string): string {
  const watermark = `
<div style="
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.75);
  color: #fff;
  text-align: center;
  padding: 8px 16px;
  font-size: 13px;
  font-family: system-ui, sans-serif;
  z-index: 99999;
  backdrop-filter: blur(4px);
">
  Сайт создан на <a href="${appUrl}" target="_blank" style="color:#a78bfa;text-decoration:underline;">Vibesite.ru</a>
</div>`

  return html.replace(/<\/body>/i, `${watermark}\n</body>`)
}

/**
 * Заменяет пустые src у img на реальные URL фотографий.
 */
export function injectPhotos(html: string, photoUrls: string[]): string {
  if (!photoUrls.length) return html

  let photoIndex = 0
  return html.replace(
    /<img([^>]*?)src=["'](placeholder|about:blank|#|)["']([^>]*?)>/gi,
    (match) => {
      if (photoIndex >= photoUrls.length) return match
      const url = photoUrls[photoIndex++]
      return match.replace(/src=["'][^"']*["']/, `src="${url}"`)
    }
  )
}
