'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Message {
  id: string
  chat_id: string
  sender_role: 'user' | 'admin'
  content: string
  created_at: string
}

interface Chat {
  id: string
  status: string
  unread_by_admin: number
  users: { email: string } | null
}

export default function AdminChatPage({ params }: { params: { chatId: string } }) {
  const { chatId } = params
  const [messages, setMessages] = useState<Message[]>([])
  const [chat, setChat] = useState<Chat | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/support/chat?chatId=${chatId}`)
      const data = await res.json()
      setChat(data.chat)
      setMessages(data.messages ?? [])
      setLoading(false)

      // Сбрасываем счётчик непрочитанных у админа
      await fetch('/api/support/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      })
    }
    load()
  }, [chatId])

  // Realtime подписка
  useEffect(() => {
    const channel = supabase
      .channel(`admin-chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Сбрасываем счётчик если пришло от пользователя
          if (newMsg.sender_role === 'user') {
            fetch('/api/support/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId }),
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || sending) return

    setSending(true)
    setInputValue('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_role: 'admin',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await fetch('/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, chatId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      )
    } catch {
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

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
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shrink-0">
        <Link
          href="/admin/support"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
          <span className="text-brand-700 font-semibold text-sm">
            {(chat?.users?.email?.[0] ?? '?').toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {chat?.users?.email ?? 'Загрузка...'}
          </p>
          <p className="text-xs text-gray-400">Пользователь</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Нет сообщений</p>
          </div>
        ) : (
          groupedMessages.map(({ date, msgs }) => (
            <div key={date}>
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
                      msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                        msg.sender_role === 'admin'
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      )}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        msg.sender_role === 'admin' ? 'text-brand-200 text-right' : 'text-gray-400'
                      )}>
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
      <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ответить пользователю..."
            disabled={sending}
            rows={2}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputValue.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Enter — отправить · Shift+Enter — перенос строки
        </p>
      </div>
    </div>
  )
}
