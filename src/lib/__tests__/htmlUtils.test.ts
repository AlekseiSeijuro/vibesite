import { describe, it, expect } from 'vitest'
import {
  extractHTML,
  validateHTML,
  sanitizeHTML,
  injectPhotos,
  addWatermark,
  injectDomainLock,
  minifyHTML,
  fixHiddenElements,
} from '../htmlUtils'

// ============================================================
// extractHTML
// ============================================================
describe('extractHTML', () => {
  it('убирает ```html обёртку', () => {
    const raw = '```html\n<!DOCTYPE html><html><body></body></html>\n```'
    expect(extractHTML(raw)).toBe('<!DOCTYPE html><html><body></body></html>')
  })

  it('убирает ``` без html', () => {
    const raw = '```\n<!DOCTYPE html><html><body></body></html>\n```'
    expect(extractHTML(raw)).toBe('<!DOCTYPE html><html><body></body></html>')
  })

  it('обрезает мусор перед <!DOCTYPE', () => {
    const raw = 'Here is your website:\n\n<!DOCTYPE html><html><body></body></html>'
    expect(extractHTML(raw)).toBe('<!DOCTYPE html><html><body></body></html>')
  })

  it('обрезает мусор перед <html', () => {
    const raw = 'Вот ваш сайт:\n<html><body></body></html>'
    expect(extractHTML(raw)).toBe('<html><body></body></html>')
  })

  it('возвращает чистый HTML без изменений', () => {
    const raw = '<!DOCTYPE html><html><body>Hello</body></html>'
    expect(extractHTML(raw)).toBe(raw)
  })
})

// ============================================================
// validateHTML
// ============================================================
describe('validateHTML', () => {
  it('возвращает true для валидного HTML', () => {
    expect(validateHTML('<!DOCTYPE html><html><body></body></html>')).toBe(true)
  })

  it('возвращает false без <html>', () => {
    expect(validateHTML('<body></body></html>')).toBe(false)
  })

  it('возвращает false без <body>', () => {
    expect(validateHTML('<html></html>')).toBe(false)
  })

  it('возвращает false без </html>', () => {
    expect(validateHTML('<html><body></body>')).toBe(false)
  })

  it('возвращает false для пустой строки', () => {
    expect(validateHTML('')).toBe(false)
  })
})

// ============================================================
// sanitizeHTML
// ============================================================
describe('sanitizeHTML', () => {
  it('удаляет <script> с внешним src', () => {
    const html = '<div>ok</div><script src="https://evil.com/steal.js"></script>'
    expect(sanitizeHTML(html)).toBe('<div>ok</div>')
  })

  it('удаляет скрипты с eval', () => {
    const html = '<script>eval("alert(1)")</script><div>ok</div>'
    expect(sanitizeHTML(html)).toBe('<div>ok</div>')
  })

  it('удаляет скрипты с fetch', () => {
    const html = '<script>fetch("https://evil.com")</script><p>ok</p>'
    expect(sanitizeHTML(html)).toBe('<p>ok</p>')
  })

  it('удаляет скрипты с document.cookie', () => {
    const html = '<script>var c = document.cookie</script><p>safe</p>'
    expect(sanitizeHTML(html)).toBe('<p>safe</p>')
  })

  it('оставляет безопасные инлайн-скрипты', () => {
    const html = '<script>document.querySelector("a").scrollIntoView()</script>'
    expect(sanitizeHTML(html)).toContain('scrollIntoView')
  })

  it('удаляет onclick с опасным кодом', () => {
    const html = '<button onclick="alert(1)">click</button>'
    expect(sanitizeHTML(html)).toBe('<button>click</button>')
  })

  it('оставляет onclick с scrollIntoView', () => {
    const html = `<button onclick="document.getElementById('sec').scrollIntoView()">Go</button>`
    expect(sanitizeHTML(html)).toContain('scrollIntoView')
  })

  it('удаляет meta refresh', () => {
    const html = '<head><meta http-equiv="refresh" content="0;url=evil.com"></head>'
    expect(sanitizeHTML(html)).toBe('<head></head>')
  })

  it('не трогает обычный HTML', () => {
    const html = '<div class="test"><p>Hello world</p></div>'
    expect(sanitizeHTML(html)).toBe(html)
  })
})

// ============================================================
// injectPhotos
// ============================================================
describe('injectPhotos', () => {
  it('подставляет URL в пустые src', () => {
    const html = '<img src="" alt="work"><img src="" alt="work2">'
    const result = injectPhotos(html, ['https://s3.com/1.jpg', 'https://s3.com/2.jpg'])
    expect(result).toContain('src="https://s3.com/1.jpg"')
    expect(result).toContain('src="https://s3.com/2.jpg"')
  })

  it('подставляет URL в placeholder src', () => {
    const html = '<img src="placeholder" alt="work">'
    const result = injectPhotos(html, ['https://s3.com/photo.jpg'])
    expect(result).toContain('src="https://s3.com/photo.jpg"')
  })

  it('не трогает img с реальными src', () => {
    const html = '<img src="https://real.com/photo.jpg" alt="real">'
    const result = injectPhotos(html, ['https://s3.com/other.jpg'])
    expect(result).toContain('src="https://real.com/photo.jpg"')
  })

  it('возвращает HTML без изменений если нет фото', () => {
    const html = '<img src="" alt="work">'
    expect(injectPhotos(html, [])).toBe(html)
  })

  it('не падает на пустой массив', () => {
    const html = '<div>no images</div>'
    expect(injectPhotos(html, [])).toBe(html)
  })
})

// ============================================================
// addWatermark
// ============================================================
describe('addWatermark', () => {
  it('вставляет водяной знак перед </body>', () => {
    const html = '<html><body><div>content</div></body></html>'
    const result = addWatermark(html)
    expect(result).toContain('Создано на Vibesite')
    expect(result).toContain('</body>')
    const watermarkIdx = result.indexOf('Vibesite')
    const bodyCloseIdx = result.indexOf('</body>')
    expect(watermarkIdx).toBeLessThan(bodyCloseIdx)
  })

  it('содержит ссылку на vibesite.ru', () => {
    const html = '<html><body></body></html>'
    const result = addWatermark(html)
    expect(result).toContain('href="https://vibesite.ru"')
  })
})

// ============================================================
// injectDomainLock
// ============================================================
describe('injectDomainLock', () => {
  it('вставляет скрипт после <head>', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>'
    const result = injectDomainLock(html, 'beauty-site.ru')
    expect(result).toContain('<script>')
    const headIdx = result.indexOf('<head>')
    const scriptIdx = result.indexOf('<script>')
    expect(scriptIdx).toBeGreaterThan(headIdx)
  })

  it('содержит указанный домен', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectDomainLock(html, 'beauty-site.ru')
    expect(result).toContain('beauty-site.ru')
  })

  it('разрешает localhost', () => {
    const html = '<html><head></head><body></body></html>'
    const result = injectDomainLock(html, 'beauty-site.ru')
    expect(result).toContain('localhost')
  })
})

// ============================================================
// minifyHTML
// ============================================================
describe('minifyHTML', () => {
  it('убирает HTML-комментарии', () => {
    const html = '<div><!-- это комментарий -->content</div>'
    expect(minifyHTML(html)).toBe('<div>content</div>')
  })

  it('убирает пробелы между тегами', () => {
    const html = '<div>  </div>  <p>text</p>'
    expect(minifyHTML(html)).toBe('<div></div><p>text</p>')
  })

  it('схлопывает множественные пробелы', () => {
    const html = '<p>hello    world</p>'
    expect(minifyHTML(html)).toBe('<p>hello world</p>')
  })

  it('не трогает условные комментарии IE', () => {
    const html = '<!--[if IE]><p>IE only</p><![endif]-->'
    expect(minifyHTML(html)).toContain('<!--[if IE]>')
  })
})

// ============================================================
// fixHiddenElements
// ============================================================
describe('fixHiddenElements', () => {
  it('добавляет CSS fallback если есть opacity: 0', () => {
    const html = '<html><head></head><body><div style="opacity: 0">hidden</div></body></html>'
    const result = fixHiddenElements(html)
    expect(result).toContain('opacity:1!important')
    expect(result).toContain('transform:none!important')
  })

  it('не трогает HTML без opacity: 0', () => {
    const html = '<html><head></head><body><div>visible</div></body></html>'
    expect(fixHiddenElements(html)).toBe(html)
  })

  it('вставляет <style> перед </head>', () => {
    const html = '<html><head><title>T</title></head><body><section style="opacity: 0"></section></body></html>'
    const result = fixHiddenElements(html)
    const styleIdx = result.indexOf('<style>')
    const headCloseIdx = result.indexOf('</head>')
    expect(styleIdx).toBeLessThan(headCloseIdx)
  })
})
