import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatDate, generateSubdomain, truncate } from '../utils'

// ============================================================
// cn (classnames merge)
// ============================================================
describe('cn', () => {
  it('объединяет классы', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('мержит tailwind конфликты', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('обрабатывает условные классы', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end')
  })

  it('обрабатывает undefined', () => {
    expect(cn('base', undefined, 'end')).toBe('base end')
  })
})

// ============================================================
// formatPrice
// ============================================================
describe('formatPrice', () => {
  it('форматирует цену в рублях', () => {
    const result = formatPrice(699)
    expect(result).toContain('699')
    expect(result).toContain('₽')
  })

  it('форматирует большие числа с разделителями', () => {
    const result = formatPrice(5999)
    // Должен содержать 5 999 или 5999 в зависимости от локали
    expect(result).toContain('999')
  })

  it('без дробной части', () => {
    const result = formatPrice(100)
    expect(result).not.toContain(',00')
    expect(result).not.toContain('.00')
  })
})

// ============================================================
// formatDate
// ============================================================
describe('formatDate', () => {
  it('форматирует дату на русском', () => {
    const result = formatDate('2026-04-12T00:00:00Z')
    expect(result).toContain('2026')
    expect(result).toContain('12')
  })
})

// ============================================================
// generateSubdomain
// ============================================================
describe('generateSubdomain', () => {
  it('транслитерирует кириллицу', () => {
    expect(generateSubdomain('Анна')).toBe('anna')
  })

  it('переводит в нижний регистр', () => {
    expect(generateSubdomain('Hello World')).toBe('hello-world')
  })

  it('заменяет пробелы и спецсимволы на дефис', () => {
    expect(generateSubdomain('Студия & красоты!')).toBe('studiya-krasoty')
  })

  it('убирает дублирующиеся дефисы', () => {
    expect(generateSubdomain('a - - b')).toBe('a-b')
  })

  it('убирает дефисы на краях', () => {
    expect(generateSubdomain('-hello-')).toBe('hello')
  })

  it('обрезает до 30 символов', () => {
    const long = 'а'.repeat(50)
    expect(generateSubdomain(long).length).toBeLessThanOrEqual(30)
  })

  it('обрабатывает ё', () => {
    expect(generateSubdomain('Ёж')).toBe('yozh')
  })

  it('обрабатывает сложные буквы', () => {
    expect(generateSubdomain('Щука')).toBe('shchuka')
  })
})

// ============================================================
// truncate
// ============================================================
describe('truncate', () => {
  it('не трогает короткую строку', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('обрезает длинную строку и добавляет ...', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('не трогает строку равную лимиту', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})
