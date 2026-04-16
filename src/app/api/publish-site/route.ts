import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/s3'
import { NextResponse } from 'next/server'
import { publishSiteSchema, parseBody } from '@/lib/validation/schemas'
import { track } from '@/lib/analytics'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try { rawBody = await request.json() } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
  }
  const parseResult = parseBody(publishSiteSchema, rawBody)
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 })
  }
  const websiteId = parseResult.data.websiteId

  // Получаем сайт из БД
  const { data: site } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .single()

  if (!site) {
    return NextResponse.json({ error: 'Сайт не найден' }, { status: 404 })
  }

  if (!site.generated_code) {
    return NextResponse.json(
      { error: 'Сайт ещё не сгенерирован' },
      { status: 400 }
    )
  }

  // Проверяем подписку пользователя
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isPaid = profile?.subscription_status === 'active'

  // Блокируем публикацию на поддомене для бесплатного тарифа
  if (!isPaid) {
    return NextResponse.json(
      {
        error: 'Публикация на поддомене доступна только на платном тарифе «Поддомен».',
        code: 'SUBSCRIPTION_REQUIRED',
      },
      { status: 403 }
    )
  }

  // Загружаем HTML в S3 (для публичной отдачи по поддомену)
  try {
    const htmlBuffer = Buffer.from(site.generated_code, 'utf-8')
    await uploadToS3(
      htmlBuffer,
      `sites/${site.subdomain}/index.html`,
      'text/html; charset=utf-8'
    )
  } catch (e) {
    console.error('S3 upload error:', e)
    // Не блокируем публикацию если S3 недоступен —
    // сайт всё равно отдаётся из БД через Next.js
  }

  // Обновляем статус сайта
  const { error: updateError } = await supabase
    .from('websites')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      subscription_plan: isPaid ? 'subdomain' : 'demo',
    })
    .eq('id', websiteId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Не удалось опубликовать сайт' },
      { status: 500 }
    )
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'beauty-site.ru'
  const siteUrl = `https://${site.subdomain}.${domain}`

  await track('site_published', {
    website_id: websiteId,
    subdomain: site.subdomain,
  })

  return NextResponse.json({
    websiteId,
    url: siteUrl,
    subdomain: site.subdomain,
  })
}
