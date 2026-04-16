'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

interface Message {
  id: string
  chat_id: string
  sender_role: 'user' | 'admin'
  content: string
  created_at: string
}

interface Chat {
  id: string
  unread_by_user: number
  status: string
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [chat, setChat] = useState<Chat | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Загружаем чат и сообщения
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/support/chat')
      const data = await res.json()
      setChat(data.chat)
      setMessages(data.messages ?? [])
      setLoading(false)

      // Сбрасываем счётчик непрочитанных
      if (data.chat) {
        await fetch('/api/support/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      }
    }
    load()
  }, [])

  // Realtime подписка на новые сообщения
  useEffect(() => {
    if (!chat?.id) return

    const channel = supabase
      .channel(`support:${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // не дублируем если уже есть (оптимистичное обновление)
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Сбрасываем счётчик если пришло от админа
          if (newMsg.sender_role === 'admin') {
            fetch('/api/support/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chat?.id])

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || sending) return

    setSending(true)
    setInputValue('')

    // Оптимистичное добавление
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      chat_id: chat?.id ?? '',
      sender_role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch('/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Заменяем temp сообщение на реальное
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      )

      track('support_message_sent')

      // Если чата не было — сохраняем
      if (!chat) {
        const chatRes = await fetch('/api/support/chat')
        const chatData = await chatRes.json()
        setChat(chatData.chat)
      }
    } catch {
      // Убираем temp сообщение при ошибке
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInputValue(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
  }

  // Группируем сообщения по датам
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>(
    (groups, msg) => {
      const date = new Date(msg.created_at).toDateString()
      const last = groups[groups.length - 1]
      if (last && last.date === date) {
        last.msgs.push(msg)
      } else {
        groups.push({ date, msgs: [msg] })
      }
      return groups
    },
    []
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Поддержка</h1>
        <p className="text-gray-500 text-sm mt-1">
          Напишите нам — мы ответим в ближайшее время
        </p>
      </div>

      <div className="card flex flex-col" style={{ height: '60vh' }}>

        {/* Шапка чата */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Служба поддержки</p>
            <p className="text-xs text-gray-400">Vibesite</p>
          </div>
          {chat?.status === 'closed' && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              Закрыт
            </span>
          )}
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageCircle className="h-10 w-10 text-gray-200" />
              <p className="text-gray-400 text-sm">
                Напишите нам — и мы поможем с любым вопросом
              </p>
            </div>
          ) : (
            groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                {/* Разделитель даты */}
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">
                    {formatDate(msgs[0].created_at)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="space-y-2">
                  {msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.sender_role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                          msg.sender_role === 'user'
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        )}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            msg.sender_role === 'user'
                              ? 'text-brand-200 text-right'
                              : 'text-gray-400'
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              disabled={sending || chat?.status === 'closed'}
              rows={2}
              className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !inputValue.trim() || chat?.status === 'closed'}
              className="shrink-0 w-9 h-9 flex items-center justify-center bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Enter — отправить · Shift+Enter — перенос строки
          </p>
        </div>
      </div>
    </div>
  )
}
