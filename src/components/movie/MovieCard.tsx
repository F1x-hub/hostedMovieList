'use client'

import { useState } from 'react'
import { Star, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KinopoiskMovie } from '@/types'
import Link from 'next/link'

interface MovieCardProps {
  movie: KinopoiskMovie
}

export function MovieCard({ movie }: MovieCardProps) {
  const [imageError, setImageError] = useState(false)

  const posterUrl = movie.poster?.previewUrl ?? movie.poster?.url
  const rating = movie.rating?.kp ?? movie.rating?.imdb
  const title = movie.name ?? movie.alternativeName ?? movie.enName ?? 'Unknown'
  const year = movie.year

  const ratingColor =
    !rating ? 'text-zinc-500' :
    rating >= 7 ? 'text-emerald-400' :
    rating >= 5 ? 'text-amber-400' : 'text-red-400'

  return (
    <Link href={`/movie/${movie.id}`} className="group relative flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl aspect-[2/3] bg-zinc-900 border border-zinc-800 transition-all duration-300 group-hover:border-zinc-700 group-hover:shadow-2xl group-hover:shadow-violet-500/10">
        {posterUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <Film className="w-12 h-12 text-zinc-800" />
          </div>
        )}

        {/* Rating badge */}
        {rating != null && (
          <div className={cn(
            'absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md bg-black/60 border border-white/10 shadow-lg flex items-center gap-1',
            ratingColor
          )}>
            <Star className="w-3 h-3 fill-current" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* Hover overlay with simple icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
           <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-violet-600 px-3 py-1.5 rounded-full shadow-lg">
             Подробнее
           </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-sm font-bold text-zinc-100 line-clamp-1 leading-snug group-hover:text-violet-400 transition-colors">
          {title}
        </p>
        <div className="flex items-center justify-between">
          {year && <span className="text-[11px] font-medium text-zinc-500">{year}</span>}
          {movie.genres?.[0] && (
            <span className="text-[10px] text-zinc-600 truncate max-w-[100px]">
              {movie.genres[0].name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
