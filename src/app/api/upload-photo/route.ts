import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/s3'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  // Проверка авторизации
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const websiteId = formData.get('websiteId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
  }

  // Проверка типа файла
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Разрешены только JPEG, PNG и WebP' },
      { status: 400 }
    )
  }

  // Проверка размера
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Файл превышает 10 МБ' },
      { status: 400 }
    )
  }

  // Читаем файл
  const buffer = Buffer.from(await file.arrayBuffer())

  // Формируем ключ: photos/{userId}/{websiteId или temp}/{timestamp}-{random}.ext
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const folder = websiteId ?? 'temp'
  const key = `photos/${user.id}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`

  let url: string
  try {
    url = await uploadToS3(buffer, key, file.type)
  } catch (e) {
    console.error('S3 upload error:', e)
    return NextResponse.json(
      { error: 'Ошибка загрузки файла' },
      { status: 500 }
    )
  }

  // Сохраняем в БД если есть websiteId
  if (websiteId) {
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('website_id', websiteId)

    await supabase.from('photos').insert({
      website_id: websiteId,
      s3_url: url,
      order_index: count ?? 0,
      is_main: (count ?? 0) === 0,
    })
  }

  return NextResponse.json({ url, key })
}
