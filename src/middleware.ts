import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'beauty-site.ru'
// Полный хост приложения (без протокола), например vibesite.vercel.app или vibesite.ru
const APP_HOST = (process.env.NEXT_PUBLIC_APP_URL ?? '')
  .replace('https://', '')
  .replace('http://', '')

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> }

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''

  // ============================================================
  // ПОДДОМЕНЫ КЛИЕНТСКИХ САЙТОВ
  // Срабатывает только если:
  // 1. Хост оканчивается на .APP_DOMAIN (например .vibesite.ru)
  // 2. Хост не является самим приложением (не vibesite.vercel.app)
  // 3. Хост не www
  // ============================================================
  const isVercelPreview = host.endsWith('.vercel.app')
  const isAppHost = host === APP_HOST
  const isSubdomain =
    !isVercelPreview &&
    !isAppHost &&
    host.endsWith(`.${APP_DOMAIN}`) &&
    !host.startsWith('www.')

  if (isSubdomain) {
    const subdomain = host.replace(`.${APP_DOMAIN}`, '')
    const url = request.nextUrl.clone()
    url.pathname = `/api/site/${subdomain}`
    return NextResponse.rewrite(url)
  }

  // ============================================================
  // АВТОРИЗАЦИЯ (основной домен и Vercel preview)
  // ============================================================
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/admin']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  const authPaths = ['/login', '/register', '/reset-password']
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
