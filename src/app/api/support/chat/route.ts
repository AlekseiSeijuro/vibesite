import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId') // для админа

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (isAdmin && chatId) {
      // Админ запрашивает конкретный чат
      const { data: chat } = await supabase
        .from('support_chats')
        .select('*, users(email)')
        .eq('id', chatId)
        .single()

      const { data: messages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      return NextResponse.json({ chat, messages: messages ?? [] })
    }

    if (isAdmin && !chatId) {
      // Админ запрашивает список всех чатов
      const { data: chats } = await supabase
        .from('support_chats')
        .select('*, users(email)')
        .order('last_message_at', { ascending: false, nullsFirst: false })

      return NextResponse.json({ chats: chats ?? [] })
    }

    // Обычный пользователь — свой чат
    const { data: chat } = await supabase
      .from('support_chats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!chat) {
      return NextResponse.json({ chat: null, messages: [] })
    }

    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ chat, messages: messages ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
