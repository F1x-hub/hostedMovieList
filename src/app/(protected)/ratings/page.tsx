'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getUserRatings, deleteRating } from '@/lib/firebase/ratings'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Star, Trash2, ArrowUpDown } from 'lucide-react'
import type { RatingDoc } from '@/types'

type SortKey = 'date' | 'rating'

export default function RatingsPage() {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<(RatingDoc & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const load = async () => {
    if (!user) return
    const data = await getUserRatings(user.uid)
    setRatings(data as (RatingDoc & { _id: string })[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    setRatings((prev) => prev.filter((r) => r._id !== id))
    await deleteRating(id)
  }

  const sorted = [...ratings].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1
    if (sort === 'rating') return (a.rating - b.rating) * dir
    // Default: date (createdAt)
    const aTime = (a.createdAt as unknown as { seconds: number })?.seconds ?? 0
    const bTime = (b.createdAt as unknown as { seconds: number })?.seconds ?? 0
    return (aTime - bTime) * dir
  })

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  const avg = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Мои оценки</h1>
          {avg && (
            <p className="text-sm text-zinc-500 mt-0.5">
              {ratings.length} оценок · средний балл{' '}
              <span className="text-amber-400 font-semibold">{avg}</span>
            </p>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2">
          {(['date', 'rating'] as SortKey[]).map((key) => (
            <Button
              key={key}
              variant={sort === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => toggleSort(key)}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {key === 'date' ? 'Дата' : 'Оценка'}
              {sort === key && (sortDir === 'desc' ? '↓' : '↑')}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-zinc-500">
          <Star className="w-12 h-12 opacity-30" />
          <p className="text-sm">Вы ещё не оценили ни одного фильма</p>
          <Link href="/search" className="text-sm text-violet-400 hover:underline">Найти фильм</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((r) => (
            <div
              key={r._id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <Link href={`/movie/${r.movieId}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">Фильм #{r.movieId}</p>
                {r.comment && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{r.comment}</p>
                )}
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {r.rating}
                </span>
                <button
                  onClick={() => handleDelete(r._id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
