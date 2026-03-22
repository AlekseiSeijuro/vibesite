'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'

interface Props {
  orderId: string
  currentStatus: OrderStatus
  currentNotes: string
  userEmail: string
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new',         label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed',   label: 'Выполнена' },
  { value: 'cancelled',   label: 'Отменена' },
]

export default function OrderActions({
  orderId,
  currentStatus,
  currentNotes,
  userEmail,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes }),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      toast.success('Заявка обновлена')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Не удалось обновить заявку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
        {open ? 'Закрыть' : 'Редактировать'}
      </Button>

      {open && (
        <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200 min-w-[280px]">
          <div>
            <label className="label">Статус</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Заметки администратора</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Комментарий по заявке..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button loading={loading} onClick={handleSave} size="sm">
              Сохранить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
          </div>

          <a
            href={`mailto:${userEmail}`}
            className="block text-xs text-brand-600 hover:underline"
          >
            ✉️ Написать клиенту: {userEmail}
          </a>
        </div>
      )}
    </div>
  )
}
