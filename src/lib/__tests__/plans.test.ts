import { describe, it, expect } from 'vitest'
import { PLAN_CONFIGS, getPlanAmount, getPlanEndDate } from '../yookassa/plans'

describe('PLAN_CONFIGS', () => {
  it('содержит 3 тарифа', () => {
    expect(Object.keys(PLAN_CONFIGS)).toHaveLength(3)
  })

  it('subdomain_monthly — 699 ₽/мес', () => {
    const plan = PLAN_CONFIGS['subdomain_monthly']
    expect(plan.slug).toBe('subdomain')
    expect(plan.priceMonthly).toBe(699)
  })

  it('subdomain_yearly — 5999 ₽/год', () => {
    const plan = PLAN_CONFIGS['subdomain_yearly']
    expect(plan.slug).toBe('subdomain')
    expect(plan.priceYearly).toBe(5999)
  })

  it('custom_domain — 2999 ₽ разово', () => {
    const plan = PLAN_CONFIGS['custom_domain']
    expect(plan.slug).toBe('custom_domain')
    expect(plan.priceOnetime).toBe(2999)
  })
})

describe('getPlanAmount', () => {
  it('возвращает 699 для subdomain_monthly', () => {
    expect(getPlanAmount('subdomain_monthly')).toBe(699)
  })

  it('возвращает 5999 для subdomain_yearly', () => {
    expect(getPlanAmount('subdomain_yearly')).toBe(5999)
  })

  it('возвращает 2999 для custom_domain', () => {
    expect(getPlanAmount('custom_domain')).toBe(2999)
  })

  it('бросает ошибку для неизвестного тарифа', () => {
    expect(() => getPlanAmount('unknown_plan')).toThrow('Unknown plan')
  })
})

describe('getPlanEndDate', () => {
  it('subdomain_monthly — дата через ~30 дней', () => {
    const now = new Date()
    const end = getPlanEndDate('subdomain_monthly')
    expect(end).not.toBeNull()
    const diffDays = (end!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(27)
    expect(diffDays).toBeLessThanOrEqual(32)
  })

  it('subdomain_yearly — дата через ~365 дней', () => {
    const now = new Date()
    const end = getPlanEndDate('subdomain_yearly')
    expect(end).not.toBeNull()
    const diffDays = (end!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(364)
    expect(diffDays).toBeLessThanOrEqual(367)
  })

  it('custom_domain — null (бессрочно)', () => {
    expect(getPlanEndDate('custom_domain')).toBeNull()
  })
})
