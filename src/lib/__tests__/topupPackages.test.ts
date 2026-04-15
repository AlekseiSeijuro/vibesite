import { describe, it, expect } from 'vitest'
import { TOPUP_PACKAGES } from '../topupPackages'

describe('TOPUP_PACKAGES', () => {
  it('содержит 3 пакета', () => {
    expect(TOPUP_PACKAGES).toHaveLength(3)
  })

  it('цена за правку = 49 ₽ для каждого пакета', () => {
    TOPUP_PACKAGES.forEach((pkg) => {
      expect(pkg.amount / pkg.edits).toBe(49)
    })
  })

  it('пакеты отсортированы по количеству правок', () => {
    for (let i = 1; i < TOPUP_PACKAGES.length; i++) {
      expect(TOPUP_PACKAGES[i].edits).toBeGreaterThan(TOPUP_PACKAGES[i - 1].edits)
    }
  })

  it('каждый пакет имеет уникальный id', () => {
    const ids = TOPUP_PACKAGES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('конкретные значения пакетов соответствуют документации', () => {
    expect(TOPUP_PACKAGES[0]).toEqual({ id: 'topup_5', edits: 5, amount: 245, label: '5 правок' })
    expect(TOPUP_PACKAGES[1]).toEqual({ id: 'topup_10', edits: 10, amount: 490, label: '10 правок' })
    expect(TOPUP_PACKAGES[2]).toEqual({ id: 'topup_20', edits: 20, amount: 980, label: '20 правок' })
  })
})
