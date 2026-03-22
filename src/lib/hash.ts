import { createHash } from 'crypto'
import type { WebsiteFormData } from '@/types'

/**
 * Вычисляет хеш данных формы для кэширования генерации.
 * Если данные не изменились — не нужно перегенерировать.
 */
export function hashFormData(data: Partial<WebsiteFormData>): string {
  // Нормализуем: сортируем ключи для стабильного хеша
  const normalized = JSON.stringify(data, Object.keys(data).sort())
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}
