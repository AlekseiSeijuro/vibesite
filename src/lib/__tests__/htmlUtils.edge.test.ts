import { describe, it, expect } from 'vitest'
import { sanitizeHTML, extractHTML, minifyHTML, injectPhotos } from '../htmlUtils'

describe('sanitizeHTML — edge cases', () => {
  it('удаляет скрипт с localStorage', () => {
    const html = '<script>localStorage.setItem("key","val")</script><p>ok</p>'
    expect(sanitizeHTML(html)).toBe('<p>ok</p>')
  })

  it('удаляет скрипт с sessionStorage', () => {
    const html = '<script>sessionStorage.getItem("key")</script><p>ok</p>'
    expect(sanitizeHTML(html)).toBe('<p>ok</p>')
  })

  it('удаляет скрипт с XMLHttpRequest', () => {
    const html = '<script>new XMLHttpRequest()</script><p>ok</p>'
    expect(sanitizeHTML(html)).toBe('<p>ok</p>')
  })

  it('удаляет onload обработчик', () => {
    const html = '<img onload="alert(1)" src="x.jpg">'
    const result = sanitizeHTML(html)
    expect(result).not.toContain('onload')
  })

  it('удаляет onerror обработчик', () => {
    const html = '<img onerror="alert(1)" src="x.jpg">'
    const result = sanitizeHTML(html)
    expect(result).not.toContain('onerror')
  })

  it('удаляет множественные опасные скрипты', () => {
    const html = '<script src="a.js"></script><p>1</p><script>eval("x")</script><p>2</p><script src="b.js"></script>'
    const result = sanitizeHTML(html)
    expect(result).toBe('<p>1</p><p>2</p>')
  })

  it('не удаляет style теги', () => {
    const html = '<style>.red { color: red; }</style><div class="red">ok</div>'
    expect(sanitizeHTML(html)).toContain('<style>')
  })

  it('не удаляет link теги для CSS', () => {
    const html = '<link rel="stylesheet" href="styles.css"><div>ok</div>'
    expect(sanitizeHTML(html)).toContain('<link')
  })
})

describe('extractHTML — edge cases', () => {
  it('обрабатывает пустой ввод', () => {
    expect(extractHTML('')).toBe('')
  })

  it('обрабатывает только мусор без HTML', () => {
    const raw = 'просто текст без HTML'
    expect(extractHTML(raw)).toBe('просто текст без HTML')
  })
})

describe('minifyHTML — edge cases', () => {
  it('обрабатывает пустую строку', () => {
    expect(minifyHTML('')).toBe('')
  })

  it('сохраняет содержимое тегов', () => {
    const html = '<p>Hello World</p>'
    expect(minifyHTML(html)).toBe('<p>Hello World</p>')
  })

  it('убирает множественные комментарии', () => {
    const html = '<!-- comment1 --><div>ok</div><!-- comment2 -->'
    expect(minifyHTML(html)).toBe('<div>ok</div>')
  })
})

describe('injectPhotos — edge cases', () => {
  it('подставляет фото в src="#"', () => {
    const html = '<img src="#" alt="work">'
    const result = injectPhotos(html, ['https://s3.com/photo.jpg'])
    expect(result).toContain('src="https://s3.com/photo.jpg"')
  })

  it('подставляет фото в src="about:blank"', () => {
    const html = '<img src="about:blank" alt="work">'
    const result = injectPhotos(html, ['https://s3.com/photo.jpg'])
    expect(result).toContain('src="https://s3.com/photo.jpg"')
  })

  it('не подставляет больше фото чем есть в массиве', () => {
    const html = '<img src="" alt="1"><img src="" alt="2"><img src="" alt="3">'
    const result = injectPhotos(html, ['https://s3.com/1.jpg'])
    expect(result).toContain('src="https://s3.com/1.jpg"')
    expect(result.match(/src=""/g)?.length).toBe(2)
  })
})
