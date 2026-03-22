'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Props {
  siteId: string
  status: string
}

export default function SiteActions({ siteId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: 'archive' | 'regenerate') => {
    setLoading(action)
    try {
      if (action === 'archive') {
        const res = await fetch(`/api/admin/sites/${siteId}/archive`, {
          method: 'POST',
        })
        if (!res.ok) throw new Error('Ошибка')
        toast.success('Сайт архивирован')
        router.refresh()
      } else {
        const res = await fetch('/api/regenerate-site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId: siteId }),
        })
        if (!res.ok) throw new Error('Ошибка')
        toast.success('Перегенерация запущена')
        router.refresh()
      }
    } catch {
      toast.error('Что-то пошло не так')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="secondary"
        loading={loading === 'regenerate'}
        onClick={() => handleAction('regenerate')}
      >
        Обновить
      </Button>
      {status !== 'archived' && (
        <Button
          size="sm"
          variant="ghost"
          loading={loading === 'archive'}
          onClick={() => handleAction('archive')}
        >
          Архив
        </Button>
      )}
    </div>
  )
}
