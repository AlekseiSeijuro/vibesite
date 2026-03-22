/**
 * Утилиты для обработки HTML сгенерированного Claude
 */

export function extractHTML(rawResponse: string): string {
  let html = rawResponse
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const doctypeIdx = html.search(/<!DOCTYPE\s+html/i)
  const htmlIdx = html.search(/<html/i)
  const startIdx = doctypeIdx !== -1 ? doctypeIdx : htmlIdx

  if (startIdx > 0) {
    html = html.slice(startIdx)
  }

  return html
}

export function validateHTML(html: string): boolean {
  const hasHtml = /<html/i.test(html)
  const hasBody = /<body/i.test(html)
  const hasClosingHtml = /<\/html>/i.test(html)
  return hasHtml && hasBody && hasClosingHtml
}

export function sanitizeHTML(html: string): string {
  let clean = html

  // Удаляем <script> с внешними src
  clean = clean.replace(
    /<script[^>]*src=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  )

  // Удаляем <script> с опасными функциями
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
    const dangerous =
      /eval\s*\(|fetch\s*\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage/i
    return dangerous.test(match) ? '' : match
  })

  // Удаляем опасные обработчики событий
  clean = clean.replace(
    /\s(onclick|onload|onerror|onmouseover|onsubmit|onfocus|onblur)=["'][^"']*["']/gi,
    (match) => {
      const safe = /scrollIntoView|scrollTo|window\.location\.hash/i
      return safe.test(match) ? match : ''
    }
  )

  // Удаляем meta refresh
  clean = clean.replace(
    /<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi,
    ''
  )

  return clean
}

export function injectPhotos(html: string, photoUrls: string[]): string {
  if (!photoUrls || photoUrls.length === 0) return html

  let result = html
  let photoIndex = 0

  result = result.replace(
    /(<img[^>]*\s)src=["'](|placeholder|#|about:blank)["']/gi,
    (match, prefix) => {
      if (photoIndex < photoUrls.length) {
        return `${prefix}src="${photoUrls[photoIndex++]}"`
      }
      return match
    }
  )

  return result
}

export function addWatermark(html: string): string {
  const watermark = `
<div style="
  position:fixed;bottom:16px;right:16px;z-index:99999;
  background:rgba(0,0,0,0.75);color:white;padding:6px 12px;
  border-radius:20px;font-size:12px;
  font-family:-apple-system,sans-serif;
">
  ✨ <a href="https://vibesite.ru" target="_blank"
    style="color:white;text-decoration:none;">Создано на Vibesite</a>
</div>`

  return html.replace(/<\/body>/i, `${watermark}\n</body>`)
}
