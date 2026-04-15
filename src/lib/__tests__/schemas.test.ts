import { describe, it, expect } from 'vitest'
import {
  websiteFormDataSchema,
  generateSiteSchema,
  publishSiteSchema,
  contactInfoSchema,
  serviceItemSchema,
  parseBody,
} from '../validation/schemas'

// ============================================================
// serviceItemSchema
// ============================================================
describe('serviceItemSchema', () => {
  it('принимает валидную услугу', () => {
    const result = serviceItemSchema.safeParse({ id: '1', name: 'Маникюр', price: '2000 ₽' })
    expect(result.success).toBe(true)
  })

  it('принимает услугу с описанием', () => {
    const result = serviceItemSchema.safeParse({ id: '1', name: 'Маникюр', price: '2000', description: 'Классика' })
    expect(result.success).toBe(true)
  })

  it('отклоняет пустое название', () => {
    const result = serviceItemSchema.safeParse({ id: '1', name: '', price: '2000' })
    expect(result.success).toBe(false)
  })

  it('отклоняет пустую цену', () => {
    const result = serviceItemSchema.safeParse({ id: '1', name: 'Маникюр', price: '' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// contactInfoSchema
// ============================================================
describe('contactInfoSchema', () => {
  it('принимает WhatsApp', () => {
    const result = contactInfoSchema.safeParse({ whatsapp: '+79001234567' })
    expect(result.success).toBe(true)
  })

  it('принимает Telegram', () => {
    const result = contactInfoSchema.safeParse({ telegram: '@username' })
    expect(result.success).toBe(true)
  })

  it('принимает несколько контактов', () => {
    const result = contactInfoSchema.safeParse({ whatsapp: '+79001234567', telegram: '@user' })
    expect(result.success).toBe(true)
  })

  it('отклоняет пустые контакты', () => {
    const result = contactInfoSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('отклоняет все пустые строки', () => {
    const result = contactInfoSchema.safeParse({ whatsapp: '', telegram: '', phone: '' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// websiteFormDataSchema
// ============================================================
describe('websiteFormDataSchema', () => {
  const validData = {
    niche: 'manicure',
    master_name: 'Анна',
    city: 'Москва',
    contacts: { whatsapp: '+79001234567' },
    services: [{ id: '1', name: 'Маникюр', price: '2000' }],
    style: 'friendly',
  }

  it('принимает валидные данные', () => {
    expect(websiteFormDataSchema.safeParse(validData).success).toBe(true)
  })

  it('отклоняет неизвестную нишу', () => {
    expect(websiteFormDataSchema.safeParse({ ...validData, niche: 'unknown' }).success).toBe(false)
  })

  it('отклоняет неизвестный стиль', () => {
    expect(websiteFormDataSchema.safeParse({ ...validData, style: 'unknown' }).success).toBe(false)
  })

  it('отклоняет слишком короткое имя', () => {
    expect(websiteFormDataSchema.safeParse({ ...validData, master_name: 'А' }).success).toBe(false)
  })

  it('отклоняет пустые услуги', () => {
    expect(websiteFormDataSchema.safeParse({ ...validData, services: [] }).success).toBe(false)
  })

  it('отклоняет больше 20 услуг', () => {
    const services = Array.from({ length: 21 }, (_, i) => ({ id: String(i), name: `S${i}`, price: '100' }))
    expect(websiteFormDataSchema.safeParse({ ...validData, services }).success).toBe(false)
  })

  it('принимает все 9 ниш', () => {
    const niches = ['manicure', 'pedicure', 'eyebrows', 'lashes', 'cosmetology', 'massage', 'makeup', 'hair', 'other']
    niches.forEach((niche) => {
      expect(websiteFormDataSchema.safeParse({ ...validData, niche }).success).toBe(true)
    })
  })

  it('принимает все 3 стиля', () => {
    const styles = ['laconic', 'friendly', 'premium']
    styles.forEach((style) => {
      expect(websiteFormDataSchema.safeParse({ ...validData, style }).success).toBe(true)
    })
  })

  it('принимает до 10 фото URL', () => {
    const photo_urls = Array.from({ length: 10 }, (_, i) => `https://s3.com/${i}.jpg`)
    expect(websiteFormDataSchema.safeParse({ ...validData, photo_urls }).success).toBe(true)
  })

  it('отклоняет больше 10 фото', () => {
    const photo_urls = Array.from({ length: 11 }, (_, i) => `https://s3.com/${i}.jpg`)
    expect(websiteFormDataSchema.safeParse({ ...validData, photo_urls }).success).toBe(false)
  })
})

// ============================================================
// generateSiteSchema
// ============================================================
describe('generateSiteSchema', () => {
  const validFormData = {
    niche: 'manicure',
    master_name: 'Анна',
    city: 'Москва',
    contacts: { whatsapp: '+79001234567' },
    services: [{ id: '1', name: 'Маникюр', price: '2000' }],
    style: 'friendly',
  }

  it('принимает без websiteId', () => {
    expect(generateSiteSchema.safeParse({ formData: validFormData }).success).toBe(true)
  })

  it('принимает с websiteId UUID', () => {
    expect(
      generateSiteSchema.safeParse({
        formData: validFormData,
        websiteId: 'dacb5f79-cc64-45ae-94c3-48f8915c87b9',
      }).success
    ).toBe(true)
  })

  it('отклоняет невалидный websiteId', () => {
    expect(
      generateSiteSchema.safeParse({ formData: validFormData, websiteId: 'not-a-uuid' }).success
    ).toBe(false)
  })
})

// ============================================================
// publishSiteSchema
// ============================================================
describe('publishSiteSchema', () => {
  it('принимает валидный UUID', () => {
    expect(
      publishSiteSchema.safeParse({ websiteId: 'dacb5f79-cc64-45ae-94c3-48f8915c87b9' }).success
    ).toBe(true)
  })

  it('отклоняет невалидный UUID', () => {
    expect(publishSiteSchema.safeParse({ websiteId: '12345' }).success).toBe(false)
  })
})

// ============================================================
// parseBody
// ============================================================
describe('parseBody', () => {
  it('возвращает success: true для валидных данных', () => {
    const result = parseBody(publishSiteSchema, { websiteId: 'dacb5f79-cc64-45ae-94c3-48f8915c87b9' })
    expect(result.success).toBe(true)
    expect(result.data).not.toBeNull()
  })

  it('возвращает success: false с ошибкой для невалидных данных', () => {
    const result = parseBody(publishSiteSchema, { websiteId: 'bad' })
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
