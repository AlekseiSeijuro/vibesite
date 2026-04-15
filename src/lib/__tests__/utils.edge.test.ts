import { describe, it, expect } from 'vitest'
import { generateSubdomain, sleep } from '../utils'

describe('generateSubdomain — расширенные кейсы', () => {
  it('обрабатывает пустую строку', () => {
    expect(generateSubdomain('')).toBe('')
  })

  it('обрабатывает только спецсимволы', () => {
    expect(generateSubdomain('!@#$%')).toBe('')
  })

  it('обрабатывает смесь кириллицы и латиницы', () => {
    expect(generateSubdomain('Студия Nails')).toBe('studiya-nails')
  })

  it('обрабатывает числа', () => {
    expect(generateSubdomain('Studio 42')).toBe('studio-42')
  })
})

describe('sleep', () => {
  it('ждёт указанное время', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40)
  })
})
