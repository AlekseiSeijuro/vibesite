'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Monitor,
  Smartphone,
  RefreshCw,
  Globe,
  ExternalLink,
  Edit,
  CheckCircle,
  Loader2,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Website } from '@/types'

interface Props {
  site: Website
  isPaid: boolean
  hasCompletedOrder: boolean
  editBalance: number
}

type ViewMode = 'desktop' | 'mobile'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const EDIT_COST = 50
const DESKTOP_RENDER_WIDTH = 1280

function getSiteUrl(subdomain: string | null, status: string): string | null {
  if (!subdomain || status !== 'published') return null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vibesite.ru'
  const isVercel = appUrl.includes('vercel.app') || appUrl.includes('localhost')
  if (isVercel) return `${appUrl}/api/site/${subdomain}`
  return `https://${subdomain}.${appDomain}`
}

export default function PreviewClient({ site, isPaid, hasCompletedOrder, editBalance: initialBalance }: Props) {
  const router = useRouter()

  // --- превью ---
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(site.status === 'published')
  const [currentSubdomain, setCurrentSubdomain] = useState(site.subdomain)
  const [siteUrl, setSiteUrl] = useState<string | null>(
    getSiteUrl(site.subdomain, site.status)
  )
  const [iframeKey, setIframeKey] = useState(0)

  // refs для масштабирования desktop-режима
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // --- чат ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Привет! Опишите что изменить на сайте — и я внесу правку. Например: «сделай кнопку записи зелёной» или «измени заголовок на "Студия красоты Анна"».',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [balance, setBalance] = useState(initialBalance)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Масштабирование iframe под контейнер в desktop-режиме.
  // Пересчитывается при: смене viewMode, смене iframeKey, ресайзе окна.
  useEffect(() => {
    if (viewMode !== 'desktop') return

    const applyScale = () => {
      const container = containerRef.current
      const iframe = iframeRef.current
      if (!container || !iframe) return
      const scale = container.offsetWidth / DESKTOP_RENDER_WIDTH
      iframe.style.width = `${DESKTOP_RENDER_WIDTH}px`
      iframe.style.height = `${container.offsetHeight / scale}px`
      iframe.style.transform = `scale(${scale})`
      iframe.style.transformOrigin = 'top left'
    }

    // небольшая задержка чтобы DOM успел отрисоваться после смены viewMode
    const t = setTimeout(applyScale, 10)
    window.addEventListener('resize', applyScale)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', applyScale)
    }
  }, [viewMode, iframeKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // --- handlers превью ---

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/regenerate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: site.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Сайт перегенерирован!')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка перегенерации')
    } finally {
      setRegenerating(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/publish-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: site.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPublished(true)
      setCurrentSubdomain(data.subdomain)
      const url = getSiteUrl(data.subdomain, 'published')
      setSiteUrl(url)
      toast.success('Сайт опубликован!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка публикации')
    } finally {
      setPublishing(false)
    }
  }

  // --- handler чата ---

  const handleEdit = async () => {
    const message = inputValue.trim()
    if (!message || editing) return

    if (balance < EDIT_COST) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text: message },
        {
          role: 'assistant',
          text: `На балансе недостаточно средств. Для правки нужно ${EDIT_COST} ₽, у вас ${balance} ₽. Пополните баланс в разделе «Биллинг».`,
        },
      ])
      setInputValue('')
      return
    }

    setMessages(prev => [...prev, { role: 'user', text: message }])
    setInputValue('')
    setEditing(true)

    try {
      const res = await fetch('/api/edit-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: site.id, userMessage: message }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              text: `На балансе недостаточно средств. Для правки нужно ${EDIT_COST} ₽, у вас ${data.balance} ₽. Пополните баланс в разделе «Биллинг».`,
            },
          ])
          return
        }
        throw new Error(data.error)
      }

      setBalance(data.newBalance)
      setIframeKey(k => k + 1)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Готово! Правка внесена. Списано ${EDIT_COST} ₽, остаток: ${data.newBalance} ₽.`,
        },
      ])
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Не удалось внести правку: ${e instanceof Error ? e.message : 'неизвестная ошибка'}. Попробуйте ещё раз.`,
        },
      ])
    } finally {
      setEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEdit()
    }
  }

  const masterName =
    (site.meta_data as { master_name?: string })?.master_name ?? 'Сайт'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── Панель управления ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{masterName}</p>
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-0.5"
            >
              Открыть сайт
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Desktop / Mobile */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('desktop')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'desktop'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
            title="Десктоп"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'mobile'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
            title="Мобильный"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        <Button variant="secondary" size="sm" loading={regenerating} onClick={handleRegenerate}>
          <RefreshCw className="h-4 w-4" />
          Перегенерировать
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/dashboard/create?id=${site.id}`)}
        >
          <Edit className="h-4 w-4" />
          Изменить данные
        </Button>

        {published ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Опубликован
            </div>
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Открыть
              </a>
            )}
          </div>
        ) : (
          <Button loading={publishing} onClick={handlePublish} size="sm">
            <Globe className="h-4 w-4" />
            Опубликовать
          </Button>
        )}
      </div>

      {/* ── Основная область: iframe + чат ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Превью сайта ── */}
        <div className="flex-1 bg-gray-100 flex items-start justify-center overflow-hidden p-3">
          {site.generated_code ? (
            <div
              ref={containerRef}
              className={cn(
                'relative bg-white shadow-xl rounded-lg overflow-hidden h-full',
                viewMode === 'desktop' ? 'w-full' : 'w-[390px]'
              )}
            >
              {viewMode === 'desktop' ? (
                // iframe рендерится в DESKTOP_RENDER_WIDTH и масштабируется через transform: scale
                <iframe
                  ref={iframeRef}
                  key={`desktop-${iframeKey}`}
                  src={`/api/preview/${site.id}`}
                  style={{ border: 'none', display: 'block', position: 'absolute', top: 0, left: 0 }}
                  title="Предпросмотр сайта"
                />
              ) : (
                // Mobile: обычный iframe 390px, старые transform-стили не применяются
                <iframe
                  key={`mobile-${iframeKey}`}
                  src={`/api/preview/${site.id}`}
                  style={{ border: 'none', display: 'block', width: '100%', height: '100%' }}
                  title="Предпросмотр сайта"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400 mt-20">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Генерация сайта...</p>
            </div>
          )}
        </div>

        {/* ── Панель чата ── */}
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col">

          {/* Заголовок */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span className="font-semibold text-gray-900 text-sm">AI-редактор</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Wallet className="h-3.5 w-3.5" />
                <span>Баланс: <span className={cn('font-medium', balance < EDIT_COST ? 'text-red-500' : 'text-gray-700')}>{balance} ₽</span></span>
              </div>
              <span className="text-xs text-gray-400">{EDIT_COST} ₽ / правка</span>
            </div>
            {balance < EDIT_COST && (
              <a
                href="/dashboard/billing"
                className="mt-2 block text-center text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors rounded-md py-1.5 font-medium"
              >
                Пополнить баланс →
              </a>
            )}
          </div>

          {/* История сообщений */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {editing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="px-3 py-3 border-t border-gray-100">
            <div className="flex gap-2 items-end">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите правку..."
                disabled={editing}
                rows={2}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={handleEdit}
                disabled={editing || !inputValue.trim()}
                className="shrink-0 w-9 h-9 flex items-center justify-center bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                title="Отправить"
              >
                {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Enter — отправить · Shift+Enter — перенос строки
            </p>
          </div>
        </div>
      </div>

      {/* ── Баннер демо ── */}
      {!isPaid && (
        <div className="bg-brand-50 border-t border-brand-100 px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-brand-700">
            <span className="font-medium">Демо-режим:</span> на сайте отображается водяной знак Vibesite
          </p>
          <a href="/pricing" className="btn-primary text-xs py-1.5 px-3 shrink-0">
            Убрать водяной знак
          </a>
        </div>
      )}
    </div>
  )
}
