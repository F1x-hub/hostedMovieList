import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | CineList',
    default: 'CineList — Ваш список фильмов',
  },
  description:
    'Оценивайте фильмы, ведите список просмотренного и делитесь подборками с друзьями.',
  keywords: ['фильмы', 'оценки', 'кино', 'watchlist', 'кинопоиск'],
  authors: [{ name: 'CineList' }],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'CineList',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
