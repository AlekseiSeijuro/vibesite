import Link from 'next/link'
import { Sparkles, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mb-6">
          <Sparkles className="h-8 w-8 text-brand-400" />
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          Страница не найдена
        </h2>
        <p className="text-gray-500 mb-8">
          Страница которую вы ищете не существует или была удалена.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" />
            На главную
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            В кабинет
          </Link>
        </div>
      </div>
    </div>
  )
}
