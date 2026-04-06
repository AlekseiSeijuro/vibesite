/**
 * ЮKassa клиент
 * Документация: https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start
 *
 * Для активации нужно:
 * 1. Зарегистрироваться на yookassa.ru и подключить магазин
 * 2. В личном кабинете: Настройки → Ключи API → получить shopId и secretKey
 * 3. Там же включить webhook: указать URL https://твой-домен.ru/api/payments/webhook
 * 4. Заполнить в .env.local:
 *    YOOKASSA_SHOP_ID=123456
 *    YOOKASSA_SECRET_KEY=live_xxxxxxxxxxxx
 *
 * Для тестирования используй:
 *    YOOKASSA_SHOP_ID=100500  (тестовый магазин)
 *    YOOKASSA_SECRET_KEY=test_xxxxxxxxxxxx
 * Тестовые карты: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing
 */

const YOOKASSA_API = 'https://api.yookassa.ru/v3'

function getAuth(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error(
      'ЮKassa не настроена. Заполните YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env.local'
    )
  }

  return Buffer.from(`${shopId}:${secretKey}`).toString('base64')
}

function generateIdempotenceKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ============================================================
// ТИПЫ
// ============================================================

export type YookassaPaymentStatus =
  | 'pending'
  | 'waiting_for_capture'
  | 'succeeded'
  | 'canceled'

export interface YookassaPayment {
  id: string
  status: YookassaPaymentStatus
  amount: {
    value: string
    currency: string
  }
  confirmation?: {
    type: string
    confirmation_url: string
  }
  metadata?: Record<string, string>
  created_at: string
  paid: boolean
}

export interface CreatePaymentParams {
  amount: number
  description: string
  returnUrl: string
  cancelUrl?: string
  metadata?: Record<string, string>
}

// ============================================================
// МЕТОДЫ
// ============================================================

/**
 * Создать платёж и получить ссылку на оплату
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<YookassaPayment> {
  const body = {
    amount: {
      value: params.amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
      ...(params.cancelUrl ? { cancel_url: params.cancelUrl } : {}),
    },
    description: params.description,
    metadata: params.metadata ?? {},
    capture: true,
  }

  const response = await fetch(`${YOOKASSA_API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${getAuth()}`,
      'Idempotence-Key': generateIdempotenceKey(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `ЮKassa error ${response.status}: ${error.description ?? JSON.stringify(error)}`
    )
  }

  return response.json()
}

/**
 * Получить информацию о платеже по ID
 */
export async function getPayment(paymentId: string): Promise<YookassaPayment> {
  const response = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${getAuth()}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `ЮKassa error ${response.status}: ${error.description ?? JSON.stringify(error)}`
    )
  }

  return response.json()
}

/**
 * Проверить подпись входящего webhook уведомления
 * ЮKassa не использует подписи — достаточно перепроверить платёж через API
 */
export async function verifyWebhookPayment(
  paymentId: string
): Promise<YookassaPayment> {
  return getPayment(paymentId)
}

/**
 * Проверить что ЮKassa настроена (ключи заполнены)
 */
export function isYookassaConfigured(): boolean {
  return !!(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY)
}
