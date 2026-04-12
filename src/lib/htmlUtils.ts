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

/**
 * Вставляет JS-скрипт привязки к домену.
 * Если сайт открыт не на *.beauty-site.ru — скрывает контент и показывает заглушку.
 * Также затрудняет просмотр исходников через горячие клавиши.
 */
export function injectDomainLock(html: string, allowedDomain: string): string {
  // Минифицированный скрипт — намеренно без пробелов, чтобы не привлекать внимание
  const script = `<script>(function(){var d=window.location.hostname;var ok=d==='${allowedDomain}'||d.endsWith('.${allowedDomain}')||d==='localhost'||d.endsWith('.localhost');if(!ok){document.documentElement.style.display='none';window.addEventListener('DOMContentLoaded',function(){document.documentElement.style.display='';var b=document.body;if(b){b.innerHTML='<div style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb"><div style="text-align:center;padding:2rem;max-width:400px"><div style="font-size:3rem;margin-bottom:1rem">\uD83D\uDD12</div><h1 style="font-size:1.5rem;color:#1a202c;margin:0 0 .5rem">\u0421\u0430\u0439\u0442 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D</h1><p style="color:#718096;margin:0 0 1.5rem">\u042D\u0442\u043E\u0442 \u0441\u0430\u0439\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435 beauty-site.ru</p><a href="https://${allowedDomain}" style="display:inline-block;background:#9333ea;color:white;text-decoration:none;padding:.75rem 1.5rem;border-radius:8px;font-weight:500">\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0432\u043E\u0439 \u0441\u0430\u0439\u0442 \u2192</a></div></div>'}});document.documentElement.style.display='none'}document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U'||e.key==='s'||e.key==='S')){e.preventDefault()}})})();</script>`

  // Вставляем сразу после <head> — до любого контента, чтобы сработало как можно раньше
  return html.replace(/(<head[^>]*>)/i, `$1\n${script}`)
}

/**
 * Минифицирует HTML: убирает комментарии, лишние пробелы и переносы строк между тегами.
 * Делает исходник нечитаемым при просмотре через DevTools.
 */
export function minifyHTML(html: string): string {
  return html
    // Убираем HTML-комментарии (кроме условных комментариев IE вида <!--[if ...)
    .replace(/<!--(?!\[if)[\s\S]*?-->/gi, '')
    // Убираем переносы строк и лишние пробелы между тегами
    .replace(/>\s+</g, '><')
    // Убираем пробелы в начале и конце строк
    .replace(/^\s+|\s+$/gm, '')
    // Схлопываем несколько пробелов подряд в один (внутри атрибутов и текста)
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * Исправляет невидимые элементы: если AI поставил opacity: 0 и рассчитывал на JS
 * для анимации (который был удалён sanitizeHTML) — добавляем CSS fallback.
 */
export function fixHiddenElements(html: string): string {
  const hasHiddenElements = /opacity:\s*0/i.test(html)
  if (!hasHiddenElements) return html

  const fallbackStyle = `<style>section,div,header,main,footer,article,nav{opacity:1!important;transform:none!important;visibility:visible!important}</style>`
  return html.replace(/<\/head>/i, `${fallbackStyle}\n</head>`)
}
