'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw, Archive, Loader2 } from 'lucide-react'

export default function AdminSiteActions({ siteId }: { siteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRegenerate = async () => {
    setLoading('regen')
    try {
      const res = await fetch('/api/regenerate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: siteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Сайт перегенерирован')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Архивировать сайт?')) return
    setLoading('archive')
    try {
      const res = await fetch('/api/admin/archive-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      })
      if (!res.ok) throw new Error('Ошибка')
      toast.success('Сайт архивирован')
      router.refresh()
    } catch {
      toast.error('Не удалось архивировать')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRegenerate}
        disabled={!!loading}
        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title="Перегенерировать"
      >
        {loading === 'regen'
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <RefreshCw className="h-4 w-4" />
        }
      </button>
      <button
        onClick={handleArchive}
        disabled={!!loading}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Архивировать"
      >
        {loading === 'archive'
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Archive className="h-4 w-4" />
        }
      </button>
    </div>
  )
}
