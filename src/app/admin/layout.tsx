import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Users, Globe, FileText, ClipboardList, Settings, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin',        label: 'Пользователи', icon: Users,         exact: true },
  { href: '/admin/sites',  label: 'Сайты',        icon: Globe },
  { href: '/admin/orders', label: 'Заявки',        icon: ClipboardList },
  { href: '/admin/support',label: 'Поддержка',      icon: MessageCircle },
  { href: '/admin/logs',   label: 'Логи',          icon: FileText },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = await createAdminClient()

  // Проверяем роль напрямую в БД
  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Суммарный счётчик непрочитанных сообщений для бейджа в навигации
  const { data: unreadData } = await adminSupabase
    .from('support_chats')
    .select('unread_by_admin')
    .gt('unread_by_admin', 0)

  const totalUnread = (unreadData ?? []).reduce(
    (sum: number, c: { unread_by_admin: number }) => sum + c.unread_by_admin,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Боковая панель */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-gray-900">Vibesite</span>
          </Link>
          <span className="text-xs text-gray-400 mt-1 block">Админ-панель</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <AdminNavLink key={item.href} {...item} unread={item.href === '/admin/support' ? totalUnread : 0} />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Личный кабинет
          </Link>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 ml-56 p-8">
        {children}
      </main>
    </div>
  )
}

// Отдельный серверный компонент не может быть 'use client',
// поэтому делаем простую ссылку без usePathname
function AdminNavLink({
  href,
  label,
  icon: Icon,
  unread = 0,
}: {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  unread?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {unread > 0 && (
        <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
          {unread}
        </span>
      )}
    </Link>
  )
}
