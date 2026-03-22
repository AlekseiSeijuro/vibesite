'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface Props {
  prompt: string
  response: string
  status: string
}

export default function LogModal({ prompt, response, status }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'prompt' | 'response'>('prompt')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-brand-600 hover:underline flex items-center gap-1"
      >
        Открыть
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-900">Детали генерации</h2>
                <span className={`badge ${status === 'success' ? 'badge-green' : status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>
                  {status}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3">
              {(['prompt', 'response'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'prompt' ? 'Промпт' : 'Ответ модели'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-mono leading-relaxed">
                {tab === 'prompt'
                  ? prompt || 'Промпт не сохранён'
                  : response || 'Ответ не сохранён'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
