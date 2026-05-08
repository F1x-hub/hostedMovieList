'use client'

import { MovieCard } from './MovieCard'
import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import type { KinopoiskMovie } from '@/types'

interface MovieGridProps {
  movies: KinopoiskMovie[]
  loading?: boolean
  emptyMessage?: string
}

export function MovieGrid({
  movies,
  loading,
  emptyMessage = 'Ничего не найдено',
}: MovieGridProps) {
  if (loading) return <MovieGridSkeleton />

  if (!movies.length) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-sm italic">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
        />
      ))}
    </div>
  )
}
