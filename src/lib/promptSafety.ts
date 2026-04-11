/**
 * Валидация и санитизация пользовательского ввода,
 * который попадает в промпты для AI.
 *
 * Защищает от:
 * - Prompt injection (попытки перехватить управление моделью)
 * - Генерации вредоносного контента (скрипты, фишинг)
 * - Бессмысленных запросов, сжигающих токены
 * - Слишком длинных сообщений
 */

// ============================================================
// Паттерны prompt injection
// ============================================================

const INJECTION_PATTERNS: RegExp[] = [
  // Прямые инструкции модели
  /забудь\s+(все|всё|предыдущ|инструкц)/i,
  /игнорир\w*\s+(все|всё|предыдущ|инструкц|правил|систем)/i,
  /новая?\s+(роль|задач|инструкц)/i,
  /ты\s+теперь\s+не/i,
  /притворись|представь\s+что\s+ты/i,
  /выступ(и|ай)\s+(в\s+роли|как)/i,
  /действуй\s+как/i,

  // Английские варианты
  /ignore\s+(all|previous|above|prior)\s+(instructions?|rules?|prompts?)/i,
  /forget\s+(all|everything|previous|your)/i,
  /disregard\s+(all|previous|above|prior)/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(a|an|if)/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /new\s+(role|instruction|task|persona)/i,
  /override\s+(system|safety|previous)/i,
  /jailbreak/i,
  /DAN\s*mode/i,
  /developer\s*mode/i,

  // Попытки вставить системные промпты
  /\bsystem\s*:/i,
  /\[system\]/i,
  /<<\s*sys/i,
  /\bsystem\s+prompt/i,

  // Попытки получить исходный промпт
  /покажи\s+(свой|систем\w*|исходн\w*)\s+(промпт|prompt|инструкц)/i,
  /repeat\s+(your|the|system)\s+(prompt|instructions?)/i,
  /what\s+(are|were)\s+your\s+(instructions?|rules?)/i,
]

// ============================================================
// Паттерны запросов вредоносного контента
// ============================================================

const MALICIOUS_CONTENT_PATTERNS: RegExp[] = [
  // Запросы на вредоносный код
  /добавь\s+(скрипт|javascript|js)\s*(для|котор\w*)\s*(сбор|кра[жд]|перехват|отправ)/i,
  /вставь\s*(код|скрипт)\s*(для|котор\w*)\s*(редирект|перенаправ|фишинг)/i,
  /keylog/i,
  /cookie\s*(steal|theft|grab)/i,
  /crypto\s*min(er|ing)/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /localStorage\s*\.\s*(get|set)/i,
  /XMLHttpRequest|fetch\s*\(\s*['"]http/i,

  // Фишинг
  /форм[аы]\s*(для|сбора)\s*(паролей|карт|данных|логин)/i,
  /поддел\w*\s*(страниц|сайт|форм)/i,
  /phishing/i,

  // Скрытые элементы
  /скрыт\w*\s*(iframe|фрейм|ссылк|redirect)/i,
  /hidden\s*iframe/i,
  /display\s*:\s*none.*<\s*(iframe|script|form)/i,
]

// ============================================================
// Функции валидации
// ============================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: string
}

/**
 * Валидирует текст правки из AI-редактора.
 * Проверяет длину, injection, вредоносный контент.
 */
export function validateEditMessage(message: string): ValidationResult {
  const trimmed = message.trim()

  if (!trimmed) {
    return { valid: false, error: 'Сообщение не может быть пустым' }
  }

  if (trimmed.length > 1000) {
    return { valid: false, error: 'Сообщение слишком длинное — максимум 1000 символов' }
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Опишите правку подробнее' }
  }

  // Проверка на prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Сообщение содержит недопустимые инструкции. Опишите конкретное изменение на сайте.' }
    }
  }

  // Проверка на вредоносный контент
  for (const pattern of MALICIOUS_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Запрос содержит недопустимый контент. Опишите визуальное изменение на сайте.' }
    }
  }

  return { valid: true, sanitized: trimmed }
}

/**
 * Валидирует поле style_notes (дополнительные пожелания при создании сайта).
 */
export function validateStyleNotes(notes: string): ValidationResult {
  const trimmed = notes.trim()

  if (!trimmed) {
    return { valid: true, sanitized: '' } // поле необязательное
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Пожелания слишком длинные — максимум 500 символов' }
  }

  // Проверка на prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Пожелания содержат недопустимые инструкции. Опишите желаемый стиль или элементы дизайна.' }
    }
  }

  // Проверка на вредоносный контент
  for (const pattern of MALICIOUS_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Пожелания содержат недопустимый контент.' }
    }
  }

  return { valid: true, sanitized: trimmed }
}

/**
 * Санитизирует текстовые поля формы, которые попадают в промпт.
 * Удаляет символы, которые могут сломать промпт или быть частью injection.
 */
export function sanitizeFormField(value: string): string {
  return value
    // Убираем управляющие символы (кроме \n и \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Убираем разделители промптов
    .replace(/={3,}/g, '')
    .replace(/─{3,}/g, '')
    .replace(/—{3,}/g, '')
    // Убираем попытки вставить блоки с инструкциями
    .replace(/\[?(system|assistant|user)\]?\s*:/gi, '')
    .replace(/<<\s*sys\s*>>/gi, '')
    .trim()
}

/**
 * Валидирует обычное текстовое поле формы (имя, город, услуги и т.д.).
 * Проверяет на injection — поля вроде "имя мастера" не должны содержать
 * инструкций для модели.
 *
 * @param value    — значение поля
 * @param label    — название поля для сообщения об ошибке
 * @param required — обязательное ли поле
 */
export function validateFormField(
  value: string | undefined,
  label: string,
  required = false
): ValidationResult {
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    if (required) {
      return { valid: false, error: `Поле «${label}» обязательно для заполнения` }
    }
    return { valid: true, sanitized: '' }
  }

  // Проверка на prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `Поле «${label}» содержит недопустимый текст` }
    }
  }

  // Проверка на вредоносный контент
  for (const pattern of MALICIOUS_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `Поле «${label}» содержит недопустимый контент` }
    }
  }

  return { valid: true, sanitized: sanitizeFormField(trimmed) }
}

/**
 * Валидирует все текстовые поля формы создания сайта разом.
 * Возвращает первую найденную ошибку или sanitized данные.
 */
export function validateAllFormFields(formData: {
  master_name: string
  studio_name?: string
  city: string
  address?: string
  style_notes?: string
  services?: { id: string; name: string; price: string; description?: string }[]
}): ValidationResult {
  // Основные поля
  const fields: { value: string | undefined; label: string; required: boolean }[] = [
    { value: formData.master_name, label: 'Имя мастера', required: true },
    { value: formData.studio_name, label: 'Название студии', required: false },
    { value: formData.city, label: 'Город', required: true },
    { value: formData.address, label: 'Адрес', required: false },
  ]

  for (const field of fields) {
    const result = validateFormField(field.value, field.label, field.required)
    if (!result.valid) return result
  }

  // Style notes — отдельная валидация
  if (formData.style_notes) {
    const notesResult = validateStyleNotes(formData.style_notes)
    if (!notesResult.valid) return notesResult
  }

  // Услуги
  if (formData.services) {
    for (let i = 0; i < formData.services.length; i++) {
      const s = formData.services[i]
      const nameResult = validateFormField(s.name, `Услуга ${i + 1} — название`, true)
      if (!nameResult.valid) return nameResult

      const priceResult = validateFormField(s.price, `Услуга ${i + 1} — цена`, true)
      if (!priceResult.valid) return priceResult

      if (s.description) {
        const descResult = validateFormField(s.description, `Услуга ${i + 1} — описание`, false)
        if (!descResult.valid) return descResult
      }
    }
  }

  return { valid: true }
}
