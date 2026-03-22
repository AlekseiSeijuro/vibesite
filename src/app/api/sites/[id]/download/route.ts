import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Проверяем что сайт принадлежит пользователю
  const { data: site } = await supabase
    .from('websites')
    .select('id, generated_code, meta_data, subdomain, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!site?.generated_code) {
    return NextResponse.json({ error: 'Сайт не найден' }, { status: 404 })
  }

  // Проверяем что у пользователя есть выполненный заказ на этот сайт
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('website_id', params.id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single()

    if (!order) {
      return NextResponse.json(
        { error: 'Доступ запрещён. Для скачивания исходников оформите тариф «Свой домен».' },
        { status: 403 }
      )
    }
  }

  const masterName =
    (site.meta_data as { master_name?: string })?.master_name ?? 'site'

  // Получаем фотографии сайта
  const { data: photos } = await supabase
    .from('photos')
    .select('s3_url, order_index')
    .eq('website_id', params.id)
    .order('order_index')

  // Формируем HTML с инструкцией и README
  const readme = `# Сайт "${masterName}"

Создан с помощью Vibesite.ru

## Состав архива

- index.html — основная страница сайта
- README.md — эта инструкция

## Как разместить сайт

### Вариант 1 — Любой хостинг (Timeweb, Beget, REG.RU и др.)
1. Войдите в панель управления хостингом
2. Откройте файловый менеджер
3. Перейдите в папку public_html (или www)
4. Загрузите файл index.html
5. Сайт доступен по адресу вашего домена

### Вариант 2 — GitHub Pages (бесплатно)
1. Создайте репозиторий на github.com
2. Загрузите index.html
3. Настройки → Pages → Source: main → Save
4. Сайт будет на username.github.io/repo-name

### Вариант 3 — Netlify (бесплатно)
1. Зайдите на netlify.com
2. Перетащите папку с index.html в браузер
3. Сайт сразу появится по временному адресу
4. Подключите свой домен в настройках

## Фотографии

Фотографии в сайте загружены с нашего сервера.
${photos && photos.length > 0
  ? `Список URL фотографий:\n${photos.map((p, i) => `${i + 1}. ${p.s3_url}`).join('\n')}\n\nРекомендуем скачать фотографии и разместить их рядом с index.html,\nзатем обновить пути в HTML файле.`
  : 'Фотографии не были загружены.'}

## Поддержка

По всем вопросам: vibesite.ru
`

  // Создаём простой ZIP вручную (без библиотек)
  // Для простоты отдаём HTML файл напрямую с правильными заголовками
  // Полноценный ZIP требует библиотеку archiver которая не работает на edge

  const safeFileName = masterName
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)

  // Добавляем README как комментарий в начало HTML
  const htmlWithReadme = `<!--
${readme}
-->
${site.generated_code}`

  return new NextResponse(htmlWithReadme, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFileName}.html"`,
    },
  })
}
