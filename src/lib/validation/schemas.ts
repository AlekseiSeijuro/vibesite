import { z } from 'zod'

// ============================================================
// Общие схемы валидации для API endpoints
// ============================================================

export const serviceItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Название обязательно').max(100),
  price: z.string().min(1, 'Цена обязательна').max(50),
  description: z.string().max(200).optional(),
})

export const contactInfoSchema = z
  .object({
    whatsapp:  z.string().max(20).optional(),
    telegram:  z.string().max(50).optional(),
    phone:     z.string().max(20).optional(),
    email:     z.string().email().optional().or(z.literal('')),
    instagram: z.string().max(50).optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v && v.trim() !== ''),
    { message: 'Укажите хотя бы один контакт' }
  )

export const websiteFormDataSchema = z.object({
  niche: z.enum([
    'manicure', 'pedicure', 'eyebrows', 'lashes',
    'cosmetology', 'massage', 'makeup', 'hair', 'other',
  ]),
  niche_custom: z.string().max(50).optional(),
  master_name:  z.string().min(2).max(60),
  studio_name:  z.string().max(60).optional(),
  city:         z.string().min(2).max(50),
  address:      z.string().max(100).optional(),
  contacts:     contactInfoSchema,
  services:     z.array(serviceItemSchema).min(1).max(20),
  style:        z.enum(['laconic', 'friendly', 'premium']),
  style_notes:  z.string().max(500).optional(),
  photo_urls:   z.array(z.string().url()).max(10).optional(),
})

export const generateSiteSchema = z.object({
  formData:  websiteFormDataSchema,
  websiteId: z.string().uuid().optional().nullable(),
})

export const publishSiteSchema = z.object({
  websiteId: z.string().uuid(),
})

export const createPaymentSchema = z.object({
  planKey:   z.enum(['subdomain_monthly', 'subdomain_yearly', 'custom_domain']),
  websiteId: z.string().uuid(),
})

// ============================================================
// Хелпер с явными типами — TypeScript понимает сужение
// ============================================================
export type ParseSuccess<T> = { success: true; data: T; error: null }
export type ParseFailure    = { success: false; data: null; error: string }
export type ParseResult<T>  = ParseSuccess<T> | ParseFailure

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): ParseResult<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    return { success: false, data: null, error: messages }
  }
  return { success: true, data: result.data, error: null }
}
