'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Film, User, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function NavBar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Film className="w-6 h-6 text-violet-400" />
          <span className="font-bold text-zinc-100 hidden sm:block">CineList</span>
        </Link>

        {/* Search (desktop) */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const q = formData.get('q') as string
            if (q.trim()) {
              router.push(`/search?q=${encodeURIComponent(q.trim())}`)
            } else {
              router.push('/search')
            }
          }}
          className={cn(
            'hidden md:flex items-center gap-2 flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-sm transition-colors focus-within:border-violet-500 focus-within:bg-zinc-800/80',
            pathname === '/search' && 'border-violet-500 bg-zinc-800/80'
          )}
        >
          <input
            type="text"
            name="q"
            placeholder="Найти фильм..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-500"
            autoComplete="off"
          />
          <button type="submit" className="p-1.5 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <Link
            href="/search"
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* User avatar */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-800 transition-colors"
                aria-label="User menu"
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl py-1 animate-fade-in">
                  <Link
                    href={`/profile/${user.uid}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Мой профиль
                  </Link>
                  <hr className="border-zinc-800 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
