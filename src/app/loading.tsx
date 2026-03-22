import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mb-4 animate-pulse-slow">
          <Sparkles className="h-7 w-7 text-brand-500" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Загрузка...</p>
      </div>
    </div>
  )
}
