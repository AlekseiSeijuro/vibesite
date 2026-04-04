import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageCircle, Circle } from 'lucide-react'

interface Chat {
  id: string
  status: string
  unread_by_admin: number
  last_message_at: string | null
  created_at: string
  users: { email: string } | null
}

export default async function AdminSupportPage() {
  const supabase = await createClient()

  const { data: chats } = await supabase
    .from('support_chats')
    .select('*, users(email)')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const totalUnread = (chats ?? []).reduce((sum: number, c: Chat) => sum + (c.unread_by_admin ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поддержка</h1>
          <p className="text-gray-500 text-sm mt-1">Чаты с пользователями</p>
        </div>
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
            {totalUnread} новых
          </span>
        )}
      </div>

      {!chats || chats.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <MessageCircle className="h-10 w-10 text-gray-200" />
          <p className="text-gray-400">Пока нет обращений</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(chats as Chat[]).map((chat) => (
            <Link
              key={chat.id}
              href={`/admin/support/${chat.id}`}
              className="card flex items-center gap-4 hover:border-brand-200 transition-colors"
            >
              {/* Аватар */}
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-semibold text-sm">
                  {(chat.users?.email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {chat.users?.email ?? 'Неизвестный пользователь'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chat.last_message_at
                    ? new Date(chat.last_message_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Нет сообщений'}
                </p>
              </div>

              {/* Статус и счётчик */}
              <div className="flex items-center gap-2 shrink-0">
                {chat.status === 'open' ? (
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                ) : (
                  <Circle className="h-2 w-2 fill-gray-300 text-gray-300" />
                )}
                {chat.unread_by_admin > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
                    {chat.unread_by_admin}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
