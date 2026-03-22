'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import type { Website } from '@/types'

interface Props {
  site: Website
  isPaid: boolean
}

type ViewMode = 'desktop' | 'mobile'

export default function PreviewClient({ site, isPaid }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(site.status === 'published')
  const [siteUrl, setSiteUrl] = useState<string | null>(
    site.subdomain && site.status === 'published'
      ? `https://${site.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vibesite.ru'}`
      : null
  )

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
      setSiteUrl(data.url)
      toast.success('Сайт опубликован!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка публикации')
    } finally {
      setPublishing(false)
    }
  }

  const masterName =
    (site.meta_data as { master_name?: string })?.master_name ?? 'Сайт'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Панель управления */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Название */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{masterName}</p>
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline flex items-center gap-1"
            >
              {siteUrl.replace('https://', '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Переключатель вида */}
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

        {/* Кнопки действий */}
        <Button
          variant="secondary"
          size="sm"
          loading={regenerating}
          onClick={handleRegenerate}
        >
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
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4" />
            Опубликован
          </div>
        ) : (
          <Button loading={publishing} onClick={handlePublish} size="sm">
            <Globe className="h-4 w-4" />
            Опубликовать
          </Button>
        )}
      </div>

      {/* Iframe с сайтом */}
      <div className="flex-1 bg-gray-200 flex items-start justify-center overflow-auto p-4">
        {site.generated_code ? (
          <div
            className={cn(
              'bg-white shadow-xl rounded-lg overflow-hidden transition-all',
              viewMode === 'desktop' ? 'w-full max-w-5xl' : 'w-[390px]'
            )}
            style={{ minHeight: '600px' }}
          >
            <iframe
              srcDoc={site.generated_code}
              className="w-full"
              style={{ height: '80vh', border: 'none' }}
              sandbox="allow-same-origin"
              title="Предпросмотр сайта"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-gray-400 mt-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Генерация сайта...</p>
          </div>
        )}
      </div>

      {/* Баннер для демо */}
      {!isPaid && (
        <div className="bg-brand-50 border-t border-brand-100 px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="text-sm text-brand-700">
            <span className="font-medium">Демо-режим:</span> на сайте отображается
            водяной знак Vibesite
          </p>
          <a href="/pricing" className="btn-primary text-xs py-1.5 px-3 shrink-0">
            Убрать водяной знак
          </a>
        </div>
      )}
    </div>
  )
}
