import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Используем прямой Supabase клиент без cookies —
// публичный endpoint, авторизация не нужна
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _request: Request,
  { params }: { params: { subdomain: string } }
) {
  console.log('[site] Fetching subdomain:', params.subdomain)

  const { data: site, error } = await supabase
    .from('websites')
    .select('generated_code, status')
    .eq('subdomain', params.subdomain)
    .eq('status', 'published')
    .single()

  console.log('[site] Result:', { found: !!site, error: error?.message })

  if (!site?.generated_code) {
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vibesite.ru'
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сайт не найден — Vibesite</title>
  <style>
    body{font-family:-apple-system,sans-serif;display:flex;align-items:center;
    justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
    .box{text-align:center;padding:2rem}
    h1{font-size:2rem;color:#1a202c;margin-bottom:.5rem}
    p{color:#718096;margin-bottom:1.5rem}
    a{color:#9333ea;text-decoration:none;font-weight:500}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>Сайт <strong>${params.subdomain}</strong> не найден или ещё не опубликован</p>
    <a href="https://${domain}">Создать свой сайт на Vibesite →</a>
  </div>
</body>
</html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  return new NextResponse(site.generated_code, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
