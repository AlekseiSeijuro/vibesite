// Загрузка .env
const fs = require('fs')
const path = require('path')
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return
    const eq = line.indexOf('=')
    if (eq === -1) return
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  })
}
/**
 * Vibesite Generation Worker
 * Лёгкий сервер на VPS для фоновой генерации сайтов.
 * Принимает задачи от Vercel, вызывает RouterAI, записывает результат в Supabase.
 *
 * Запуск:
 *   node worker.js
 *
 * Переменные окружения (скопировать из .env.local проекта):
 *   ROUTERAI_API_KEY, ROUTERAI_MODEL,
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   NEXT_PUBLIC_APP_DOMAIN,
 *   WORKER_SECRET — секретный ключ для авторизации запросов от Vercel
 */

const http = require('http')
const https = require('https')

// ============================================================
// Конфиг
// ============================================================
const PORT = process.env.WORKER_PORT || 3100
const WORKER_SECRET = process.env.WORKER_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ROUTERAI_KEY = process.env.ROUTERAI_API_KEY
const ROUTERAI_MODEL = process.env.ROUTERAI_MODEL || 'anthropic/claude-sonnet-4-5'
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'beauty-site.ru'
const MAX_RETRIES = 3

// ============================================================
// Supabase helpers (прямые HTTP запросы, без SDK)
// ============================================================
async function supabaseQuery(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('json')) {
    return res.json()
  }
  return null
}

async function supabaseUpdate(table, id, data) {
  return supabaseQuery('PATCH', `${table}?id=eq.${id}`, data)
}

async function supabaseInsert(table, data) {
  return supabaseQuery('POST', table, data)
}

// ============================================================
// RouterAI (OpenAI-совместимый API)
// ============================================================
async function callRouterAI(systemPrompt, userPrompt) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 300000) // 5 минут таймаут

  try {
    const res = await fetch('https://routerai.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROUTERAI_KEY}`,
      },
      body: JSON.stringify({
        model: ROUTERAI_MODEL,
        max_tokens: 16000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`RouterAI error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const choices = data.choices || []
    const firstChoice = choices[0] || {}
    const msg = firstChoice.message || {}
    const content = msg.content || ''
    const usage = data.usage || {}
    const tokensUsed = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
    return { content, tokensUsed }
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================
// HTML обработка (упрощённые версии из htmlUtils.ts)
// ============================================================
function extractHTML(raw) {
  let html = raw
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const idx = html.search(/<!DOCTYPE\s+html/i)
  const htmlIdx = html.search(/<html/i)
  const startIdx = idx !== -1 ? idx : htmlIdx
  if (startIdx > 0) html = html.slice(startIdx)
  return html
}

function validateHTML(html) {
  return /<html/i.test(html) && /<body/i.test(html) && /<\/html>/i.test(html)
}

function sanitizeHTML(html) {
  let clean = html
  clean = clean.replace(/<script[^>]*src=["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
    const dangerous = /eval\s*\(|fetch\s*\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage/i
    return dangerous.test(match) ? '' : match
  })
  clean = clean.replace(/\s(onclick|onload|onerror|onmouseover|onsubmit|onfocus|onblur)=["'][^"']*["']/gi, (match) => {
    const safe = /scrollIntoView|scrollTo|window\.location\.hash/i
    return safe.test(match) ? match : ''
  })
  clean = clean.replace(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi, '')
  return clean
}

function injectPhotos(html, photoUrls) {
  if (!photoUrls || photoUrls.length === 0) return html
  let result = html
  let photoIndex = 0
  result = result.replace(/(<img[^>]*\s)src=["'](|placeholder|#|about:blank)["']/gi, (match, prefix) => {
    if (photoIndex < photoUrls.length) return `${prefix}src="${photoUrls[photoIndex++]}"`
    return match
  })
  return result
}

function addWatermark(html) {
  const wm = `<div style="position:fixed;bottom:16px;right:16px;z-index:99999;background:rgba(0,0,0,0.75);color:white;padding:6px 12px;border-radius:20px;font-size:12px;font-family:-apple-system,sans-serif;">✨ <a href="https://beauty-site.ru" target="_blank" style="color:white;text-decoration:none;">Создано на Vibesite</a></div>`
  return html.replace(/<\/body>/i, `${wm}\n</body>`)
}

function injectDomainLock(html, domain) {
  const script = `<script>(function(){var d=window.location.hostname;var ok=d==='${domain}'||d.endsWith('.${domain}')||d==='localhost'||d.endsWith('.localhost');if(!ok){document.documentElement.style.display='none';window.addEventListener('DOMContentLoaded',function(){document.documentElement.style.display='';var b=document.body;if(b){b.innerHTML='<div style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb"><div style="text-align:center;padding:2rem;max-width:400px"><div style="font-size:3rem;margin-bottom:1rem">🔒</div><h1 style="font-size:1.5rem;color:#1a202c;margin:0 0 .5rem">Сайт недоступен</h1><p style="color:#718096;margin:0 0 1.5rem">Этот сайт работает только на платформе beauty-site.ru</p><a href="https://${domain}" style="display:inline-block;background:#9333ea;color:white;text-decoration:none;padding:.75rem 1.5rem;border-radius:8px;font-weight:500">Создать свой сайт →</a></div></div>'}});document.documentElement.style.display='none'}document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U'||e.key==='s'||e.key==='S')){e.preventDefault()}})})();</script>`
  return html.replace(/(<head[^>]*>)/i, `$1\n${script}`)
}

function minifyHTML(html) {
  return html
    .replace(/<!--(?!\[if)[\s\S]*?-->/gi, '')
    .replace(/>\s+</g, '><')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

function fixHiddenElements(html) {
  var hasHidden = /opacity:\s*0/i.test(html)
  if (!hasHidden) return html
  var fallback = '<style>section,div,header,main,footer,article,nav{opacity:1!important;transform:none!important;visibility:visible!important}</style>'
  return html.replace(/<\/head>/i, fallback + '\n</head>')
}

// ============================================================
// Построение промпта (копия из promptBuilder.ts)
// ============================================================
// Импортировать не можем — это TS файл. Поэтому worker вызывает
// endpoint /api/build-prompt на Vercel, или получает готовый промпт.
// Проще всего — получать промпт вместе с задачей.

const SYSTEM_PROMPT = 'Ты — профессиональный frontend-разработчик и UI/UX дизайнер. Генерируй только валидный HTML5+CSS код без каких-либо пояснений. Ответ должен начинаться с <!DOCTYPE html> и заканчиваться </html>.'

const EDIT_SYSTEM_PROMPT = 'Ты — профессиональный frontend-разработчик. Вносишь точечные правки в HTML-код сайта строго по запросу пользователя. Ответ должен начинаться с <!DOCTYPE html> и заканчиваться </html>. Никакого текста, пояснений или markdown до или после HTML.'

// ============================================================
// Основная логика генерации
// ============================================================
async function processGeneration(task) {
  const { siteId, prompt, formData, subscriptionStatus } = task

  console.log(`[worker] Starting generation for site ${siteId}`)
  console.log(`[worker] Prompt length: ${prompt.length}`)

  let generatedHTML = ''
  let tokensUsed = 0

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[worker] Attempt ${attempt}/${MAX_RETRIES}`)

    // Лог в БД
    let logId = null
    try {
      const logs = await supabaseInsert('generation_logs', {
        website_id: siteId,
        prompt_used: prompt,
        status: 'pending',
        attempt_number: attempt,
      })
      logId = (logs && logs[0]) ? logs[0].id : null
    } catch (e) {
      console.error('[worker] Failed to insert log:', e.message)
    }

    try {
      const currentPrompt = attempt > 1
        ? `${prompt}\n\nВАЖНО: Предыдущая попытка вернула некорректный HTML. Ответ должен начинаться строго с <!DOCTYPE html> и заканчиваться </html>.`
        : prompt

      const result = await callRouterAI(SYSTEM_PROMPT, currentPrompt)
      tokensUsed = result.tokensUsed
      console.log(`[worker] Got response, tokens: ${tokensUsed}, length: ${result.content.length}`)

      const extracted = extractHTML(result.content)
      const isValid = validateHTML(extracted)
      console.log(`[worker] HTML valid: ${isValid}`)

      if (!isValid) {
        if (logId) {
          await supabaseUpdate('generation_logs', logId, {
            raw_response: result.content.slice(0, 5000),
            status: 'failed',
            tokens_used: tokensUsed,
            error_message: 'Invalid HTML',
          }).catch(() => {})
        }
        continue
      }

      generatedHTML = extracted

      if (logId) {
        await supabaseUpdate('generation_logs', logId, {
          raw_response: result.content.slice(0, 5000),
          status: 'success',
          tokens_used: tokensUsed,
        }).catch(() => {})
      }

      break
    } catch (e) {
      console.error(`[worker] Generation error (attempt ${attempt}):`, e.message)
      if (logId) {
        await supabaseUpdate('generation_logs', logId, {
          status: 'failed',
          error_message: e.message,
        }).catch(() => {})
      }
    }
  }

  // Все попытки провалились
  if (!generatedHTML) {
    console.error(`[worker] All attempts failed for site ${siteId}`)
    await supabaseUpdate('websites', siteId, { status: 'draft' })
    return { success: false }
  }

  // Постобработка
  let finalHTML = sanitizeHTML(generatedHTML)
  finalHTML = fixHiddenElements(finalHTML)

  const photoUrls = formData && formData.photo_urls ? formData.photo_urls : null
  if (photoUrls && photoUrls.length > 0) {
    finalHTML = injectPhotos(finalHTML, photoUrls)
  }

  if (subscriptionStatus === 'trial') {
    finalHTML = addWatermark(finalHTML)
  }

  finalHTML = injectDomainLock(finalHTML, APP_DOMAIN)
  finalHTML = minifyHTML(finalHTML)

  // Сохраняем — Realtime/polling оповестит клиента
  await supabaseUpdate('websites', siteId, {
    generated_code: finalHTML,
    prompt_used: prompt,
    status: 'demo',
  })

  console.log(`[worker] Done! Site ${siteId} is now demo`)
  return { success: true, tokensUsed }
}

// ============================================================
// Логика AI-правки
// ============================================================
async function processEdit(task) {
  const { siteId, editLogId, userId, userMessage, htmlBefore, editCost } = task

  console.log(`[worker] Starting edit for site ${siteId}: "${userMessage.slice(0, 80)}..."`) 

  const prompt = `Ты — профессиональный frontend-разработчик. Тебе дан HTML-код сайта и запрос на правку.

ПРАВИЛА:
- Внеси ТОЛЬКО то изменение, которое просит пользователь — не трогай остальное
- Сохрани все стили, шрифты, цвета, структуру и контент которые не упомянуты в запросе
- Верни ПОЛНЫЙ HTML-код сайта начиная строго с <!DOCTYPE html> и заканчивая </html>
- Никакого текста, пояснений или markdown до или после HTML

ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
${userMessage}

HTML САЙТА:
${htmlBefore}`

  try {
    const result = await callRouterAI(EDIT_SYSTEM_PROMPT, prompt)
    const { content, tokensUsed } = result
    console.log(`[worker] Edit response, tokens: ${tokensUsed}`)

    const extracted = extractHTML(content)
    const isValid = validateHTML(extracted)

    if (!isValid) {
      console.error('[worker] Edit returned invalid HTML')
      // Возвращаем баланс
      await supabaseQuery('POST', 'rpc/topup_edit_balance', { p_user_id: userId, p_amount: editCost })
      if (editLogId) {
        await supabaseUpdate('edit_logs', editLogId, {
          status: 'failed', tokens_used: tokensUsed,
          error_message: 'AI вернул невалидный HTML',
        }).catch(() => {})
      }
      return { success: false, error: 'Модель вернула некорректный HTML' }
    }

    // Постобработка
    var finalHTML = sanitizeHTML(extracted)
    finalHTML = fixHiddenElements(finalHTML)
    finalHTML = injectDomainLock(finalHTML, APP_DOMAIN)
    finalHTML = minifyHTML(finalHTML)

    // Сохраняем
    await supabaseUpdate('websites', siteId, { generated_code: finalHTML })

    if (editLogId) {
      await supabaseUpdate('edit_logs', editLogId, {
        html_after: finalHTML, tokens_used: tokensUsed, status: 'success',
      }).catch(() => {})
    }

    console.log(`[worker] Edit done! Site ${siteId}`)
    return { success: true, tokensUsed }
  } catch (e) {
    console.error('[worker] Edit error:', e.message)
    // Возвращаем баланс
    await supabaseQuery('POST', 'rpc/topup_edit_balance', { p_user_id: userId, p_amount: editCost }).catch(() => {})
    if (editLogId) {
      await supabaseUpdate('edit_logs', editLogId, {
        status: 'failed', error_message: e.message,
      }).catch(() => {})
    }
    return { success: false, error: e.message }
  }
}

// ============================================================
// HTTP сервер
// ============================================================
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }

  // Генерация
  if (req.method === 'POST' && req.url === '/generate') {
    // Проверка секрета
    const auth = req.headers['authorization'] || ''
    if (WORKER_SECRET && auth !== `Bearer ${WORKER_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    // Парсим тело
    let body = ''
    for await (const chunk of req) body += chunk

    let task
    try {
      task = JSON.parse(body)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    if (!task.siteId || !task.prompt) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing siteId or prompt' }))
      return
    }

    // Сразу отвечаем — генерация будет в фоне
    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ accepted: true, siteId: task.siteId }))

    // Запускаем генерацию (fire-and-forget — сервер не умирает)
    processGeneration(task).catch((e) => {
      console.error('[worker] Unhandled error:', e)
      supabaseUpdate('websites', task.siteId, { status: 'draft' }).catch(() => {})
    })

    return
  }

  // AI-правка
  if (req.method === 'POST' && req.url === '/edit') {
    const auth = req.headers['authorization'] || ''
    if (WORKER_SECRET && auth !== `Bearer ${WORKER_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    let body = ''
    for await (const chunk of req) body += chunk

    let task
    try {
      task = JSON.parse(body)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    if (!task.siteId || !task.userMessage || !task.htmlBefore) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing required fields' }))
      return
    }

    // Сразу отвечаем
    res.writeHead(202, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ accepted: true, siteId: task.siteId }))

    // Правка в фоне
    processEdit(task).catch((e) => {
      console.error('[worker] Unhandled edit error:', e)
      // Возвращаем баланс при критической ошибке
      if (task.userId && task.editCost) {
        supabaseQuery('POST', 'rpc/topup_edit_balance', { p_user_id: task.userId, p_amount: task.editCost }).catch(() => {})
      }
    })

    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`[worker] Vibesite Generation Worker running on port ${PORT}`)
  console.log(`[worker] Model: ${ROUTERAI_MODEL}`)
  console.log(`[worker] Supabase: ${SUPABASE_URL}`)
})
