import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="py-5 px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
        >
          <Sparkles className="h-5 w-5 text-brand-600" />
          <span className="font-bold">Vibesite</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-5 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Vibesite
      </footer>
    </div>
  )
}
