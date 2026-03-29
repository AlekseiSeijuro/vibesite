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
  hasCompletedOrder: boolean
}

type ViewMode = 'desktop' | 'mobile'

function getSiteUrl(subdomain: string | null, status: string): string | null {
  if (!subdomain || status !== 'published') return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vibesite.ru'

  // Если деплой на Vercel (нет реального домена) — используем /api/site/поддомен
  const isVercel = appUrl.includes('vercel.app') || appUrl.includes('localhost')
  if (isVercel) {
    return `${appUrl}/api/site/${subdomain}`
  }

  // Реальный домен — красивый поддомен
  return `https://${subdomain}.${appDomain}`
}

export default function PreviewClient({ site, isPaid, hasCompletedOrder }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(site.status === 'published')
  const [currentSubdomain, setCurrentSubdomain] = useState(site.subdomain)
  const [siteUrl, setSiteUrl] = useState<string | null>(
    getSiteUrl(site.subdomain, site.status)
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

  const masterName =
    (site.meta_data as { master_name?: string })?.master_name ?? 'Сайт'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Панель управления */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">

        {/* Название и ссылка */}
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

        {/* Переключатель Desktop / Mobile */}
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

        {/* Действия */}
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

      {/* Предпросмотр */}
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
              src={`/api/preview/${site.id}`}
              className="w-full"
              style={{ height: '80vh', border: 'none' }}
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

      {/* Баннер демо */}
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
