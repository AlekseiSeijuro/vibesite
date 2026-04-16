import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Users, Globe, FileText, ClipboardList, Settings, MessageCircle, BarChart2 } from 'lucide-react'

const NAV = [
  { href: '/admin',            label: 'Пользователи', icon: Users,         exact: true },
  { href: '/admin/sites',      label: 'Сайты',        icon: Globe },
  { href: '/admin/orders',     label: 'Заявки',       icon: ClipboardList },
  { href: '/admin/support',    label: 'Поддержка',    icon: MessageCircle },
  { href: '/admin/analytics',  label: 'Аналитика',    icon: BarChart2 },
  { href: '/admin/logs',       label: 'Логи',         icon: FileText },
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

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: unreadData } = await adminSupabase
    .from('support_chats')
    .select('unread_by_admin')
    .gt('unread_by_admin', 0)

  const totalUnread = (unreadData ?? []).reduce(
    (sum: number, c: { unread_by_admin: number }) => sum + c.unread_by_admin,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Боковая панель (только md+) ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-gray-900">Vibesite</span>
          </Link>
          <span className="text-xs text-gray-400 mt-1 block">Админ-панель</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <SideNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              unread={item.href === '/admin/support' ? totalUnread : 0}
            />
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

      {/* ── Шапка на мобильных ── */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <span className="font-bold text-gray-900">Vibesite</span>
          <span className="text-xs text-gray-400 ml-1">/ Админ</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Кабинет</span>
        </Link>
      </header>

      {/* ── Контент ── */}
      <main className="md:ml-56 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Нижняя навигация (только мобильные) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        <div className="grid grid-cols-6 h-16">
          {NAV.map((item) => (
            <BottomNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              unread={item.href === '/admin/support' ? totalUnread : 0}
            />
          ))}
        </div>
      </nav>

    </div>
  )
}

function SideNavLink({
  href, label, icon: Icon, unread = 0,
}: {
  href: string; label: string; icon: React.ElementType; unread?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {unread > 0 && (
        <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full px-1.5">
          {unread}
        </span>
      )}
    </Link>
  )
}

function BottomNavLink({
  href, label, icon: Icon, unread = 0,
}: {
  href: string; label: string; icon: React.ElementType; unread?: number
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-brand-600 transition-colors"
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full px-1">
            {unread}
          </span>
        )}
      </div>
      <span className="text-[10px] leading-none">{label}</span>
    </Link>
  )
}
