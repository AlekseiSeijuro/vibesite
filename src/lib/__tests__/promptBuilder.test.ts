import { describe, it, expect } from 'vitest'
import { buildPrompt, buildEditPrompt, hashFormData } from '../promptBuilder'
import type { WebsiteFormData } from '@/types'

const mockFormData: WebsiteFormData = {
  niche: 'manicure',
  master_name: 'Анна',
  city: 'Москва',
  contacts: {
    whatsapp: '+79001234567',
    telegram: '@anna_nails',
  },
  services: [
    { id: '1', name: 'Маникюр классический', price: '2000 ₽' },
    { id: '2', name: 'Покрытие гель-лак', price: '1500 ₽', description: 'Любой цвет' },
  ],
  style: 'friendly',
}

// ============================================================
// buildPrompt
// ============================================================
describe('buildPrompt', () => {
  it('содержит имя мастера', () => {
    expect(buildPrompt(mockFormData)).toContain('Анна')
  })

  it('содержит город', () => {
    expect(buildPrompt(mockFormData)).toContain('Москва')
  })

  it('содержит нишу на русском', () => {
    expect(buildPrompt(mockFormData)).toContain('маникюр')
  })

  it('содержит контакты WhatsApp', () => {
    expect(buildPrompt(mockFormData)).toContain('+79001234567')
  })

  it('содержит контакты Telegram', () => {
    expect(buildPrompt(mockFormData)).toContain('@anna_nails')
  })

  it('содержит услуги и цены', () => {
    const prompt = buildPrompt(mockFormData)
    expect(prompt).toContain('Маникюр классический')
    expect(prompt).toContain('2000 ₽')
    expect(prompt).toContain('Покрытие гель-лак')
    expect(prompt).toContain('Любой цвет')
  })

  it('содержит стиль дизайна friendly', () => {
    const prompt = buildPrompt(mockFormData)
    expect(prompt).toContain('Glossier')
  })

  it('содержит стиль laconic для соответствующего выбора', () => {
    const data = { ...mockFormData, style: 'laconic' as const }
    expect(buildPrompt(data)).toContain('Notion')
  })

  it('содержит стиль premium для соответствующего выбора', () => {
    const data = { ...mockFormData, style: 'premium' as const }
    expect(buildPrompt(data)).toContain('Charlotte Tilbury')
  })

  it('включает фото URL если они есть', () => {
    const data = { ...mockFormData, photo_urls: ['https://s3.com/1.jpg', 'https://s3.com/2.jpg'] }
    const prompt = buildPrompt(data)
    expect(prompt).toContain('https://s3.com/1.jpg')
    expect(prompt).toContain('https://s3.com/2.jpg')
  })

  it('генерирует placeholder-текст если фото нет', () => {
    const prompt = buildPrompt(mockFormData)
    expect(prompt).toContain('placeholder')
  })

  it('включает дополнительные пожелания', () => {
    const data = { ...mockFormData, style_notes: 'Хочу розовый акцент' }
    expect(buildPrompt(data)).toContain('Хочу розовый акцент')
  })

  it('содержит название студии если указано', () => {
    const data = { ...mockFormData, studio_name: 'NailBar' }
    expect(buildPrompt(data)).toContain('NailBar')
  })

  it('генерирует ссылку для WhatsApp записи', () => {
    const prompt = buildPrompt(mockFormData)
    expect(prompt).toContain('wa.me')
  })

  it('требует только HTML в ответе', () => {
    const prompt = buildPrompt(mockFormData)
    expect(prompt).toContain('<!DOCTYPE html>')
  })
})

// ============================================================
// buildEditPrompt
// ============================================================
describe('buildEditPrompt', () => {
  it('содержит текущий HTML', () => {
    const result = buildEditPrompt('<html><body>old</body></html>', 'сделай кнопку красной')
    expect(result).toContain('<html><body>old</body></html>')
  })

  it('содержит запрос пользователя', () => {
    const result = buildEditPrompt('<html></html>', 'измени заголовок')
    expect(result).toContain('измени заголовок')
  })

  it('требует полный HTML в ответе', () => {
    const result = buildEditPrompt('<html></html>', 'test')
    expect(result).toContain('<!DOCTYPE html>')
  })
})

// ============================================================
// hashFormData
// ============================================================
describe('hashFormData', () => {
  it('возвращает строку', () => {
    expect(typeof hashFormData(mockFormData)).toBe('string')
  })

  it('детерминированный — одинаковые данные дают одинаковый хеш', () => {
    const hash1 = hashFormData(mockFormData)
    const hash2 = hashFormData(mockFormData)
    expect(hash1).toBe(hash2)
  })

  it('разные данные дают разные хеши', () => {
    const hash1 = hashFormData(mockFormData)
    const hash2 = hashFormData({ ...mockFormData, master_name: 'Мария' })
    expect(hash1).not.toBe(hash2)
  })
})
