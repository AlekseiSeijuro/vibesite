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
  laconic:
    'Минималистичный дизайн: много белого пространства, чёрный или тёмно-серый текст, тонкие линии, шрифт без засечек. Никаких ярких цветов, только нейтральная палитра.',
  friendly:
    'Дружелюбный и тёплый дизайн: мягкие розовые, персиковые или лавандовые оттенки, округлые формы, крупные кнопки, живой и приветливый текст.',
  premium:
    'Премиальный люкс-дизайн: тёмный фон (почти чёрный или глубокий тёмно-серый), золотые или кремовые акценты, элегантная типографика, ощущение эксклюзивности.',
}

export function buildPrompt(data: WebsiteFormData): string {
  const nicheLabel = NICHE_LABELS[data.niche] ?? 'бьюти-услуги'
  const stylePrompt = STYLE_PROMPTS[data.style]

  // Блок контактов
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

  // Блок услуг
  const serviceLines = (data.services ?? [])
    .map((s, i) => {
      const desc = s.description ? ` — ${s.description}` : ''
      return `${i + 1}. ${s.name}: ${s.price}${desc}`
    })
    .join('\n')

  // Блок фото
  const photoSection =
    data.photo_urls && data.photo_urls.length > 0
      ? `Фотографии работ мастера (используй их в галерее, не заменяй плейсхолдерами):
${data.photo_urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}`
      : 'Фотографии не предоставлены. Создай секцию галереи с заглушками (серые прямоугольники с иконкой камеры).'

  // Дополнительные пожелания
  const notesSection = data.style_notes?.trim()
    ? `\nДополнительные пожелания клиента: ${data.style_notes}`
    : ''

  // Адрес
  const locationParts = [data.city, data.address].filter(Boolean).join(', ')

  return `Ты — профессиональный frontend-разработчик и UI/UX дизайнер. Создай одностраничный сайт-визитку для мастера бьюти-сферы.

ДАННЫЕ МАСТЕРА:
- Ниша: ${nicheLabel}
- Имя мастера: ${data.master_name}${data.studio_name ? `\n- Название студии: ${data.studio_name}` : ''}
- Расположение: ${locationParts}
- Контакты:
${contactLines.map((l) => `  ${l}`).join('\n')}

УСЛУГИ И ЦЕНЫ:
${serviceLines}

${photoSection}

СТИЛЬ ОФОРМЛЕНИЯ:
${stylePrompt}${notesSection}

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
1. Только HTML5 + CSS (встроенный в тег <style>). Никакого JavaScript кроме плавной прокрутки.
2. Полностью адаптивный: корректно выглядит на телефоне (320px), планшете (768px) и десктопе (1280px+).
3. Структура страницы (секции по порядку):
   a) Шапка (header): имя мастера / название студии, краткое описание ниши, кнопка "Записаться"
   b) Галерея работ (section.gallery): фото в сетке, адаптивная
   c) Услуги и цены (section.services): карточки или таблица с ценами
   d) О мастере (section.about): 2-3 предложения о мастере (придумай на основе ниши)
   e) Контакты (section.contacts): все переданные контакты с иконками-эмодзи, кнопка "Записаться в WhatsApp" или Telegram
   f) Подвал (footer): имя, год
4. Кнопка "Записаться" должна вести на WhatsApp или Telegram (первый доступный из контактов).
5. Не используй внешние шрифты и CDN. Только системные шрифты: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif.
6. Не используй внешние иконки (Font Awesome и т.п.). Используй эмодзи или SVG-иконки встроенные прямо в код.
7. Плавные CSS-переходы на hover, мягкие тени, скруглённые углы.
8. Добавь мета-теги: title, description, viewport, og:title, og:description.

ВАЖНО: Ответ должен содержать ТОЛЬКО HTML-код, начиная с <!DOCTYPE html>. Никаких пояснений, комментариев или markdown-блоков.`
}

export function hashFormData(data: WebsiteFormData): string {
  // Простой хэш для кэширования — сравниваем строковое представление
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
