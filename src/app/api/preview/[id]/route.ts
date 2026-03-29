import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: site } = await supabase
    .from('websites')
    .select('generated_code')
    .eq('id', params.id)
    .single()

  if (!site?.generated_code) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(site.generated_code, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Запрещает встраивать iframe на сторонних доменах
      'X-Frame-Options': 'SAMEORIGIN',
      // Современный аналог X-Frame-Options — только наш домен может встраивать
      'Content-Security-Policy': "frame-ancestors 'self'",
      // Не кешировать — превью должно быть всегда актуальным
      'Cache-Control': 'no-store',
    },
  })
}
