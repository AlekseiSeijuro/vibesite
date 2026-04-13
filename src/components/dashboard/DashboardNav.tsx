'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, LayoutDashboard, Settings, LogOut, CreditCard, Home, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import { useState, useEffect } from 'react'

interface DashboardNavProps {
  user: User | null
}

const navLinks = [
  { href: '/dashboard', label: 'Мои сайты', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/billing', label: 'Подписка', icon: CreditCard },
  { href: '/dashboard/support', label: 'Поддержка', icon: MessageCircle },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
]

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)

  // Загружаем счётчик непрочитанных и подписываемся на обновления
  useEffect(() => {
    const loadUnread = async () => {
      const { data } = await supabase
        .from('support_chats')
        .select('unread_by_user')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .maybeSingle()
      setUnreadCount(data?.unread_by_user ?? 0)
    }
    loadUnread()

    const channel = supabase
      .channel('nav-unread')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_chats',
      }, (payload) => {
        setUnreadCount((payload.new as { unread_by_user: number }).unread_by_user ?? 0)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Логотип */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-gray-900">Vibesite</span>
          </Link>

          {/* Навигация */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.href === '/dashboard/support' && unreadCount > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {/* Ссылка на главную */}
            <Link
              href="/"
              className="btn-ghost text-sm text-gray-500 hidden sm:inline-flex"
              title="На главную"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">На сайт</span>
            </Link>

            <span className="hidden md:block text-sm text-gray-400 truncate max-w-[160px]">
              {user?.email}
            </span>

            <button
              onClick={handleSignOut}
              className="btn-ghost text-sm text-gray-500"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
