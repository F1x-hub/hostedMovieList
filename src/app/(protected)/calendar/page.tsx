'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getList } from '@/lib/firebase/watchlist'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import type { WatchlistDoc } from '@/types'

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export default function CalendarPage() {
  const { user } = useAuth()
  const [movies, setMovies] = useState<WatchlistDoc[]>([])
  const [loading, setLoading] = useState(true)
  const currentDate = new Date()
  const [year, setYear] = useState(currentDate.getFullYear())

  useEffect(() => {
    if (!user) return
    Promise.all([
      getList(user.uid, 'watchlist'),
      getList(user.uid, 'watching'),
      getList(user.uid, 'favorites'),
    ]).then(([w1, w2, w3]) => {
      setMovies([...w1, ...w2, ...w3])
      setLoading(false)
    })
  }, [user])

  // Group movies by release year+month (releaseYear only available)
  const byYear = movies.filter((m) => m.releaseYear === year)

  // Group by month (using releaseYear only — movies don't store month)
  // Show as "saved by year" grid
  const moviesThisYear = byYear

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Calendar className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Календарь релизов</h1>
      </div>

      {/* Year navigator */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xl font-bold text-zinc-100 w-16 text-center">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="text-sm text-zinc-500">
          {moviesThisYear.length} фильмов за {year}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : moviesThisYear.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-zinc-500">
          <Calendar className="w-12 h-12 opacity-30" />
          <p className="text-sm">В ваших списках нет фильмов {year} года</p>
          <p className="text-xs">Попробуйте выбрать другой год</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {moviesThisYear.map((movie, i) => (
            <Link
              key={`${movie.movieId}-${i}`}
              href={`/movie/${movie.movieId}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-zinc-800">
                {movie.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={movie.posterPath}
                    alt={movie.movieTitle}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800" />
                )}
              </div>
              <p className="text-sm font-medium text-zinc-100 line-clamp-1">{movie.movieTitle}</p>
              <p className="text-xs text-zinc-500">{movie.releaseYear}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
