import type { WebsiteFormData, BeautyNiche, SiteStyle } from '@/types'

const NICHE_LABELS: Record<BeautyNiche, string> = {
  manicure:    'маникюр и ногтевой сервис',
  pedicure:    'педикюр',
  eyebrows:    'оформление бровей',
  lashes:      'наращивание и ламинирование ресниц',
  cosmetology: 'косметология и уход за кожей',
  massage:     'массаж',
  makeup:      'макияж',
  hair:        'парикмахерские услуги',
  other:       'бьюти-услуги',
}

const STYLE_PROMPTS: Record<SiteStyle, string> = {
  laconic: `
СТИЛЬ: Современный минимализм (уровень дизайна Notion / Linear)
- Цветовая палитра: белый фон (#FFFFFF), акцент #18181B (почти чёрный), серые оттенки (#71717A, #F4F4F5)
- Типографика: подключи Google Fonts — "Inter" (weights: 300, 400, 500, 600, 700)
- Заголовки крупные и воздушные, много межстрочного интервала (line-height: 1.2 для h1, 1.5 для текста)
- Кнопки: прямоугольные с небольшим радиусом (border-radius: 8px), border 1.5px solid #18181B, фон прозрачный → при hover фон #18181B, текст белый
- Карточки услуг: тонкая рамка, без теней, hover — лёгкий подъём translateY(-2px)
- Разделители секций: тонкая линия 1px #E4E4E7
- Анимации: только fade-in при скролле через CSS animation, никаких резких переходов`,

  friendly: `
СТИЛЬ: Тёплый и современный (уровень дизайна Zara Beauty / Glossier)
- Цветовая палитра: кремовый фон (#FDF8F6), розово-персиковый акцент (#E8A598 или #D4A5A5), тёмный текст (#2C1810)
- Типографика: подключи Google Fonts — "Cormorant Garamond" для заголовков (italic, weights 300-600) + "Inter" для текста
- Hero секция: большой заголовок с курсивом, подзаголовок в нежном цвете
- Кнопки: rounded-full (border-radius: 50px), градиент от персикового к розовому, белый текст, нежная тень
- Карточки услуг: скруглённые (border-radius: 20px), фон #FFF5F3, hover — нежная тень rgba(212,165,165,0.3)
- Декоративные элементы: тонкие волнистые линии SVG как разделители секций
- Галерея: masonry layout или сетка с gap, фото с border-radius: 16px
- Анимации: плавный fade-up при появлении секций`,

  premium: `
СТИЛЬ: Люкс и эксклюзив (уровень дизайна La Mer / Charlotte Tilbury)
- Цветовая палитра: глубокий тёмный фон (#0F0F0F или #1A1410), золотой акцент (#C9A96E или #D4AF37), кремовый текст (#F5F0E8)
- Типографика: подключи Google Fonts — "Playfair Display" для заголовков (italic, weights 400-700) + "Montserrat" для текста (weights 300, 400)
- Hero секция: тёмный фон, крупный заголовок с золотым словом-акцентом, тонкая золотая линия-декор
- Кнопки: border 1px solid #C9A96E, золотой текст, фон прозрачный → hover фон #C9A96E, тёмный текст. Transition 0.4s ease
- Карточки услуг: тёмный фон #1C1C1C, золотая левая граница (border-left: 2px solid #C9A96E), hover — золотое свечение box-shadow
- Разделители: тонкая золотая линия с декоративным ромбом по центру (SVG)
- Галерея: сетка с тёмными оверлеями на фото, при hover оверлей исчезает
- Анимации: медленный fade-in (0.8s), параллакс-эффект на hero через CSS`,
}

const NICHE_DESCRIPTIONS: Record<BeautyNiche, string> = {
  manicure: 'Профессиональный уход за ногтями, маникюр и педикюр любой сложности',
  pedicure: 'Профессиональный педикюр и уход за стопами',
  eyebrows: 'Архитектура и оформление бровей, которые подчёркивают красоту',
  lashes: 'Наращивание и ламинирование ресниц для выразительного взгляда',
  cosmetology: 'Профессиональный уход за кожей лица и тела',
  massage: 'Расслабляющий и лечебный массаж для восстановления тела',
  makeup: 'Профессиональный макияж для любого события',
  hair: 'Стрижки, окрашивание и укладки от профессионального мастера',
  other: 'Профессиональные бьюти-услуги',
}

export function buildPrompt(data: WebsiteFormData): string {
  const nicheLabel = NICHE_LABELS[data.niche] ?? 'бьюти-услуги'
  const nicheDesc = NICHE_DESCRIPTIONS[data.niche] ?? 'Профессиональные бьюти-услуги'
  const stylePrompt = STYLE_PROMPTS[data.style]

  const contactLines: string[] = []
  if (data.contacts.whatsapp)
    contactLines.push(`WhatsApp: ${data.contacts.whatsapp}`)
  if (data.contacts.telegram)
    contactLines.push(`Telegram: ${data.contacts.telegram}`)
  if (data.contacts.phone)
    contactLines.push(`Телефон: ${data.contacts.phone}`)
  if (data.contacts.email)
    contactLines.push(`Email: ${data.contacts.email}`)
  if (data.contacts.instagram)
    contactLines.push(`Instagram: ${data.contacts.instagram}`)

  // Первый контакт для кнопки записи
  const primaryContact = data.contacts.whatsapp
    ? `https://wa.me/${data.contacts.whatsapp.replace(/\D/g, '')}`
    : data.contacts.telegram
    ? `https://t.me/${data.contacts.telegram.replace('@', '')}`
    : data.contacts.phone
    ? `tel:${data.contacts.phone.replace(/\D/g, '')}`
    : '#'

  const serviceLines = (data.services ?? [])
    .map((s, i) => {
      const desc = s.description ? ` — ${s.description}` : ''
      return `${i + 1}. ${s.name}: ${s.price}${desc}`
    })
    .join('\n')

  const photoSection =
    data.photo_urls && data.photo_urls.length > 0
      ? `ФОТОГРАФИИ РАБОТ (обязательно используй все в галерее):
${data.photo_urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}
Каждое фото — это реальная работа мастера. Покажи их красиво в сетке.`
      : `Фотографии не предоставлены. Создай красивые placeholder-блоки в стиле сайта
(градиентные прямоугольники с иконкой камеры, соответствующие цветовой палитре).`

  const notesSection = data.style_notes?.trim()
    ? `\nДОПОЛНИТЕЛЬНЫЕ ПОЖЕЛАНИЯ КЛИЕНТА (ОБЯЗАТЕЛЬНО УЧТИ): ${data.style_notes}`
    : ''

  const locationParts = [data.city, data.address].filter(Boolean).join(', ')

  return `Ты — ведущий frontend-разработчик и UI/UX дизайнер с 10-летним опытом создания премиальных сайтов для индустрии красоты. Твоя задача — создать ВЫДАЮЩИЙСЯ одностраничный сайт-визитку, который выглядит как работа профессионального дизайнерского агентства.

═══════════════════════════════════
ДАННЫЕ МАСТЕРА
═══════════════════════════════════
Ниша: ${nicheLabel}
Имя / студия: ${data.master_name}${data.studio_name ? ` — ${data.studio_name}` : ''}
Описание: ${nicheDesc}
Город: ${locationParts}
Контакты:
${contactLines.map((l) => `  • ${l}`).join('\n')}
Ссылка для записи: ${primaryContact}

УСЛУГИ И ЦЕНЫ:
${serviceLines}

${photoSection}
${notesSection}

═══════════════════════════════════
${stylePrompt}
═══════════════════════════════════

СТРУКТУРА САЙТА (строго соблюдай порядок):

1. HERO СЕКЦИЯ — первый экран, самый важный
   - Полноэкранная или большая (min-height: 100vh или 85vh)
   - Имя мастера / студии крупным заголовком (font-size: clamp(2.5rem, 6vw, 5rem))
   - Подзаголовок с нишей и городом
   - Две кнопки: «Записаться» (primary) и «Смотреть работы» (secondary, прокрутка к галерее)
   - Декоративный элемент (геометрия, градиент, паттерн — в стиле сайта)

2. ГАЛЕРЕЯ РАБОТ
   - CSS Grid: columns: repeat(auto-fill, minmax(280px, 1fr))
   - На мобиле 1-2 колонки, на десктопе 3 колонки
   - Фото с overflow: hidden, border-radius в стиле сайта
   - Hover-эффект на фото (scale или overlay)
   - Заголовок секции с декором

3. УСЛУГИ И ЦЕНЫ
   - Карточки в сетке (2-3 в ряд на десктопе, 1 на мобиле)
   - Каждая карточка: название, описание, цена крупно
   - Выделить самую популярную услугу (badge "Хит" или рамка)
   - CTA кнопка внизу секции

4. О МАСТЕРЕ
   - Короткий вдохновляющий текст (3-4 предложения, придумай в стиле ниши)
   - Несколько цифр-достижений (например: "5 лет опыта", "500+ довольных клиентов")
   - Стильное оформление (две колонки или центрированный блок)

5. КОНТАКТЫ И ЗАПИСЬ
   - Крупная кнопка «Записаться» с иконкой мессенджера
   - Все контакты с SVG-иконками (не эмодзи — именно SVG иконки для WhatsApp, Telegram, телефона)
   - Город и адрес если указаны
   - Фон секции отличается от основного

6. FOOTER
   - Имя мастера, год 2026, короткий слоган
   - Год в футере всегда 2026
   - Минималистичный

═══════════════════════════════════
ОБЯЗАТЕЛЬНЫЕ ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
═══════════════════════════════════

ШРИФТЫ: Подключи через Google Fonts в <head>:
(используй шрифты указанные в стиле выше)

CSS АНИМАЦИИ — обязательно добавь:
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
Применяй animation: fadeInUp 0.6s ease forwards на секции.
Используй animation-delay для последовательного появления элементов.

АДАПТИВНОСТЬ:
- Mobile first подход
- Breakpoints: 480px, 768px, 1024px, 1280px
- На мобиле кнопки должны быть минимум 48px высотой (touch targets)
- Навигация: на мобиле скрыть или сделать компактной

КАЧЕСТВО КОДА:
- CSS переменные (--primary-color, --accent-color, --bg-color, --text-color и т.д.)
- Плавные переходы: transition: all 0.3s ease на интерактивных элементах
- box-shadow для глубины (не злоупотреблять)
- letter-spacing на заголовках: -0.02em до -0.05em для крупного текста

SVG ИКОНКИ — встрой прямо в HTML:
- WhatsApp: зелёная иконка
- Telegram: синяя иконка
- Телефон: нейтральная иконка
- Instagram: градиентная иконка

МЕТА-ТЕГИ в <head>:
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta name="theme-color" content="..."> (цвет в стиле сайта)

═══════════════════════════════════
КРИТИЧЕСКИ ВАЖНО
═══════════════════════════════════
✓ Сайт должен выглядеть как работа профессионального дизайнера, а не шаблон
✓ Каждая секция должна быть визуально отличной и интересной
✓ Типографика — ключ к качеству: правильные размеры, отступы, веса шрифтов
✓ Цветовая палитра строго соблюдается во всём сайте
✓ Фотографии мастера ОБЯЗАТЕЛЬНО используются в галерее
✗ НЕ используй таблицы для вёрстки
✗ НЕ используй устаревший CSS (float, table-cell)
✗ НЕ добавляй JavaScript кроме плавной прокрутки (scroll-behavior: smooth в CSS)

ОТВЕТ: ТОЛЬКО HTML код начиная с <!DOCTYPE html>. Никакого текста до или после.`
}

/**
 * Промпт для редактирования уже сгенерированного сайта через чат.
 * Получает текущий HTML и запрос пользователя, возвращает изменённый HTML.
 */
export function buildEditPrompt(currentHTML: string, userMessage: string): string {
  return `Ты — профессиональный frontend-разработчик. Тебе дан HTML-код сайта и запрос на правку.

ПРАВИЛА:
- Внеси ТОЛЬКО то изменение, которое просит пользователь — не трогай остальное
- Сохрани все стили, шрифты, цвета, структуру и контент которые не упомянуты в запросе
- Верни ПОЛНЫЙ HTML-код сайта начиная строго с <!DOCTYPE html> и заканчивая </html>
- Никакого текста, пояснений или markdown до или после HTML

ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
${userMessage}

HTML САЙТА:
${currentHTML}`
}

export function hashFormData(data: WebsiteFormData): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
