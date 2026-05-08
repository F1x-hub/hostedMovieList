'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getList, removeFromList } from '@/lib/firebase/watchlist'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Trash2 } from 'lucide-react'
import type { WatchlistDoc, WatchlistType } from '@/types'
import { cn } from '@/lib/utils'

interface ListPageProps {
  listType: WatchlistType
  title: string
  emptyText: string
  accentColor: string
}

export function ListPage({ listType, title, emptyText, accentColor }: ListPageProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<(WatchlistDoc & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const data = await getList(user.uid, listType)
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = async (id: string, movieId: number | string) => {
    if (!user) return
    setItems((prev) => prev.filter((i) => i._id !== id))
    await removeFromList(user.uid, listType, movieId)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
        {!loading && <span className="text-sm text-zinc-500">{items.length} фильмов</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-zinc-500">
          <p className="text-sm">{emptyText}</p>
          <Link href="/search" className="text-sm text-violet-400 hover:underline">
            Найти фильмы
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item._id} className="group relative flex flex-col gap-2">
              <Link href={`/movie/${item.movieId}`} className="block relative overflow-hidden rounded-xl aspect-[2/3] bg-zinc-800">
                {item.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.posterPath}
                    alt={item.movieTitle}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800" />
                )}
                {/* Remove overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemove(item._id, item.movieId) }}
                    className="p-2 rounded-xl bg-red-600/80 text-white hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* KP rating */}
                {item.kpRating > 0 && (
                  <div className={cn('absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs font-bold backdrop-blur-sm bg-black/50', accentColor)}>
                    {item.kpRating.toFixed(1)}
                  </div>
                )}
              </Link>
              <p className="text-sm font-medium text-zinc-100 line-clamp-1 px-0.5">{item.movieTitle}</p>
              <p className="text-xs text-zinc-500 px-0.5">{item.releaseYear}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
