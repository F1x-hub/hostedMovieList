'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Мои оценки' },
  { href: '/search', icon: Search, label: 'Поиск фильмов' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 py-6 px-3 gap-1 border-r border-zinc-800 min-h-screen">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              active
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
