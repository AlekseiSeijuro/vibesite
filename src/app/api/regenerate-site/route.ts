import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Перегенерация просто сбрасывает data_hash чтобы обойти кэш,
// затем вызывает generate-site с теми же данными
export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let websiteId: string
  try {
    const body = await request.json()
    websiteId = body.websiteId
    if (!websiteId) throw new Error('Missing websiteId')
  } catch {
    return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 })
  }

  // Получаем сайт
  const { data: site } = await supabase
    .from('websites')
    .select('meta_data, data_hash')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .single()

  if (!site?.meta_data) {
    return NextResponse.json({ error: 'Сайт не найден' }, { status: 404 })
  }

  // Сбрасываем хэш чтобы обойти кэш
  await supabase
    .from('websites')
    .update({ data_hash: null })
    .eq('id', websiteId)

  // Вызываем generate-site — он вернёт streaming response
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/generate-site`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: request.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({
      formData: site.meta_data,
      websiteId,
    }),
  })

  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }

  // Читаем первый chunk из streaming response
  const reader = res.body?.getReader()
  if (reader) {
    const { value } = await reader.read()
    const text = new TextDecoder().decode(value)
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ websiteId, status: 'generating' })
    }
  }

  return NextResponse.json({ websiteId, status: 'generating' })
}
