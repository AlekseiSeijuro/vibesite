import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let content: string
    let chatId: string | undefined

    try {
      const body = await request.json()
      content = body.content?.trim()
      chatId = body.chatId // только для админа — отправить в конкретный чат
      if (!content) throw new Error('Empty content')
    } catch {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    // Определяем роль отправителя
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const senderRole = isAdmin ? 'admin' : 'user'

    let resolvedChatId: string

    if (isAdmin) {
      // Админ отправляет в конкретный чат по chatId
      if (!chatId) {
        return NextResponse.json({ error: 'chatId обязателен для админа' }, { status: 400 })
      }
      resolvedChatId = chatId
    } else {
      // Пользователь — находим или создаём его чат
      const { data: existingChat } = await supabase
        .from('support_chats')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingChat) {
        resolvedChatId = existingChat.id
      } else {
        const { data: newChat, error: createError } = await supabase
          .from('support_chats')
          .insert({ user_id: user.id })
          .select('id')
          .single()

        if (createError || !newChat) {
          return NextResponse.json({ error: 'Не удалось создать чат' }, { status: 500 })
        }
        resolvedChatId = newChat.id
      }
    }

    // Добавляем сообщение
    const { data: message, error: msgError } = await supabase
      .from('support_messages')
      .insert({
        chat_id: resolvedChatId,
        sender_role: senderRole,
        content,
      })
      .select()
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 })
    }

    // Обновляем счётчик непрочитанных и last_message_at
    // Если пишет user — растёт unread_by_admin, и наоборот
    const unreadField = isAdmin ? 'unread_by_user' : 'unread_by_admin'

    await supabase.rpc('increment_unread', {
      p_chat_id: resolvedChatId,
      p_field: unreadField,
    })

    await supabase
      .from('support_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', resolvedChatId)

    return NextResponse.json({ message })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
