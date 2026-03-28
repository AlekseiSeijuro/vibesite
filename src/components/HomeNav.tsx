import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default async function HomeNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-600" />
            <span className="text-lg font-bold text-gray-900">Vibesite</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className="btn-ghost text-sm hidden sm:inline-flex">
              Тарифы
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn-primary text-sm">
                <span className="hidden sm:inline">Личный кабинет</span>
                <span className="sm:hidden">Кабинет</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">
                  Войти
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  <span className="hidden sm:inline">Создать сайт</span>
                  <span className="sm:hidden">Начать</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
