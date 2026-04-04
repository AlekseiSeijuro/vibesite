import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let chatId: string | undefined

    try {
      const body = await request.json()
      chatId = body.chatId
    } catch {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (isAdmin) {
      // Админ сбрасывает unread_by_admin для конкретного чата
      if (!chatId) {
        return NextResponse.json({ error: 'chatId обязателен для админа' }, { status: 400 })
      }
      await supabase
        .from('support_chats')
        .update({ unread_by_admin: 0 })
        .eq('id', chatId)
    } else {
      // Пользователь сбрасывает unread_by_user своего чата
      await supabase
        .from('support_chats')
        .update({ unread_by_user: 0 })
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
