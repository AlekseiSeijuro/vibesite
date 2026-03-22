'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Что-то пошло не так
        </h1>
        <p className="text-gray-500 mb-2">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">
            Код ошибки: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </button>
          <Link href="/" className="btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
