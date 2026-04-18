import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { YandexMetrika } from '@/components/YandexMetrika'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: {
    default: 'Vibesite — сайт для мастера бьюти за 2 минуты',
    template: '%s | Vibesite',
  },
  description:
    'Создайте красивый сайт-визитку для мастера маникюра, бровиста, косметолога или любого другого мастера бьюти с помощью ИИ. Без дизайнера и программиста.',
  keywords: ['сайт для мастера', 'лендинг бьюти', 'сайт маникюр', 'AI сайт'],
  verification: {
    yandex: '9b0f0c81d9eb8e2e',
  },
  openGraph: {
    title: 'Vibesite — сайт для мастера бьюти за 2 минуты',
    description: 'ИИ создаёт красивый сайт-визитку по вашим данным.',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <YandexMetrika />
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { borderRadius: '12px' },
          }}
        />
      </body>
    </html>
  )
}
