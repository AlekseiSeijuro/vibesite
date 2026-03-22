import type { SubscriptionPlan } from '@/types'

export interface PlanConfig {
  slug: SubscriptionPlan
  name: string
  priceMonthly: number | null
  priceYearly: number | null
  priceOnetime: number | null
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  subdomain_monthly: {
    slug: 'subdomain',
    name: 'Поддомен (месяц)',
    priceMonthly: 700,
    priceYearly: null,
    priceOnetime: null,
  },
  subdomain_yearly: {
    slug: 'subdomain',
    name: 'Поддомен (год)',
    priceMonthly: null,
    priceYearly: 6000,
    priceOnetime: null,
  },
  custom_domain: {
    slug: 'custom_domain',
    name: 'Свой домен + исходники',
    priceMonthly: null,
    priceYearly: null,
    priceOnetime: 3500,
  },
}

export function getPlanAmount(planKey: string): number {
  const plan = PLAN_CONFIGS[planKey]
  if (!plan) throw new Error(`Unknown plan: ${planKey}`)
  return (
    plan.priceOnetime ??
    plan.priceYearly ??
    plan.priceMonthly ??
    0
  )
}

export function getPlanEndDate(planKey: string): Date | null {
  const now = new Date()
  if (planKey === 'subdomain_monthly') {
    return new Date(now.setMonth(now.getMonth() + 1))
  }
  if (planKey === 'subdomain_yearly') {
    return new Date(now.setFullYear(now.getFullYear() + 1))
  }
  return null // разовый платёж — бессрочно
}
