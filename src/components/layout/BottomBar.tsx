'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Оценки' },
  { href: '/search', icon: Search, label: 'Поиск' },
]

export function BottomBar() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800">
      <ul className="flex items-center justify-around h-16 px-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-1 rounded-xl transition-colors w-full',
                  active ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'fill-violet-400/20')} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
