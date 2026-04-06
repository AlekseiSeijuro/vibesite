// ============================================================
// DATABASE TYPES (соответствуют схеме Supabase)
// ============================================================

export type UserRole = 'user' | 'admin'
export type SubscriptionStatus = 'trial' | 'active' | 'expired'
export type WebsiteStatus = 'draft' | 'demo' | 'published' | 'archived'
export type SubscriptionPlan = 'demo' | 'subdomain' | 'custom_domain'
export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'
export type GenerationStatus = 'success' | 'failed' | 'pending'

export interface User {
  id: string
  email: string
  role: UserRole
  subscription_status: SubscriptionStatus
  subscription_ends_at: string | null
  created_at: string
}

export interface Website {
  id: string
  user_id: string
  subdomain: string | null
  custom_domain: string | null
  status: WebsiteStatus
  generated_code: string | null
  prompt_used: string | null
  meta_data: WebsiteFormData | null
  data_hash: string | null
  subscription_plan: SubscriptionPlan | null
  is_source_code_provided: boolean
  created_at: string
  published_at: string | null
}

export interface Photo {
  id: string
  website_id: string
  s3_url: string
  order_index: number
  is_main: boolean
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  type: 'subscription' | 'balance_topup'
  start_date: string
  end_date: string | null
  amount: number
  payment_id: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  website_id: string
  status: OrderStatus
  admin_notes: string | null
  created_at: string
  completed_at: string | null
}

export interface GenerationLog {
  id: string
  website_id: string
  prompt_used: string
  raw_response: string | null
  status: GenerationStatus
  attempt_number: number
  tokens_used: number | null
  created_at: string
}

export interface Plan {
  id: string
  name: string
  slug: SubscriptionPlan
  price_monthly: number | null
  price_yearly: number | null
  price_onetime: number | null
  features: string[]
  is_active: boolean
}

// ============================================================
// FORM DATA TYPES
// ============================================================

export type BeautyNiche =
  | 'manicure'
  | 'pedicure'
  | 'eyebrows'
  | 'lashes'
  | 'cosmetology'
  | 'massage'
  | 'makeup'
  | 'hair'
  | 'other'

export type SiteStyle = 'laconic' | 'friendly' | 'premium'

export interface ServiceItem {
  id: string
  name: string
  price: string
  description?: string
}

export interface ContactInfo {
  whatsapp?: string
  telegram?: string
  phone?: string
  email?: string
  instagram?: string
}

export interface WebsiteFormData {
  // Step 1 — Ниша
  niche: BeautyNiche
  niche_custom?: string

  // Step 2 — Основная информация
  master_name: string
  studio_name?: string
  city: string
  address?: string

  // Step 3 — Контакты
  contacts: ContactInfo

  // Step 4 — Услуги
  services: ServiceItem[]

  // Step 5 — Стиль
  style: SiteStyle
  style_notes?: string

  // Step 6 — Фото (добавляются после загрузки)
  photo_urls?: string[]
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface GenerateSiteResponse {
  websiteId: string
  html: string
  tokensUsed: number
}

export interface UploadPhotoResponse {
  url: string
  photoId: string
}

export interface PublishSiteResponse {
  websiteId: string
  url: string
  subdomain: string
}
