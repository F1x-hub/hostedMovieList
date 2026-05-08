'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GroupedRating } from '@/lib/firebase/ratings'

interface RatedMovieCardProps {
  rating: GroupedRating
  currentUserId?: string
}

const KP_COLOR = (n: number) =>
  n >= 7 ? 'text-emerald-400' :
  n >= 5 ? 'text-amber-400' :
           'text-red-400'

export function RatedMovieCard({ rating, currentUserId }: RatedMovieCardProps) {
  const [imgError, setImgError] = useState(false)

  const title = rating.movieTitle || `Фильм #${rating.movieId}`
  const poster = rating.posterPath
  const year = rating.releaseYear
  const genres = rating.genres || []
  const kp = rating.kpRating
  const imdb = rating.imdbRating

  // Find current user's own rating if available
  const myRating = currentUserId
    ? rating.allRaters?.find(r => r.userId === currentUserId)
    : null

  // Show primary rater (most recent or current user)
  const primaryRater = myRating ?? rating.allRaters?.[rating.allRaters.length - 1] ?? rating
  const extraRatersCount = (rating.allRaters?.length ?? 1) - 1

  return (
    <div className="mc-card group flex flex-col h-full min-h-[460px] relative">
      {/* Poster Section */}
      <Link href={`/movie/${rating.movieId}`} className="relative h-64 shrink-0 overflow-hidden">
        {poster && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <Film className="w-10 h-10 text-zinc-700" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="mc-poster-overlay absolute inset-0 z-10" />

        {/* Average rating badge — top right */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-white/10 shadow-xl">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-white">
            {rating.averageRating > 0 ? rating.averageRating.toFixed(1) : primaryRater.rating}
          </span>
        </div>

        {/* Raters count badge — top left (if >1) */}
        {rating.ratingsCount > 1 && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-950/70 backdrop-blur-md border border-white/10 text-[10px] text-zinc-300 font-medium">
            {rating.ratingsCount} оценок
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Title & Year */}
        <div className="flex items-start justify-between gap-2">
          <Link href={`/movie/${rating.movieId}`} className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-100 leading-tight line-clamp-2 group-hover:text-violet-400 transition-colors">
              {title}
            </h3>
          </Link>
          {year && (
            <span className="shrink-0 px-2 py-0.5 rounded-lg bg-zinc-800/80 text-[11px] font-medium text-zinc-400 border border-zinc-700/50">
              {year}
            </span>
          )}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-12">
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="mc-genre-tag">{g}</span>
            ))}
          </div>
        )}

        {/* Comment */}
        {primaryRater.comment ? (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">
            &ldquo;{primaryRater.comment}&rdquo;
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">Нет комментария...</p>
        )}

        {/* External Ratings Row */}
        <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Кинопоиск</span>
            <span className={cn("text-xs font-bold", kp ? KP_COLOR(kp) : 'text-zinc-600')}>
              {kp ? kp.toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">IMDb</span>
            <span className="text-xs font-bold text-amber-400">
              {imdb ? imdb.toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Средняя</span>
            <span className="text-xs font-bold text-violet-400">
              {rating.averageRating > 0 ? rating.averageRating.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        {/* Raters Bar — show all raters stacked or primary */}
        <div className="flex items-center gap-2 mt-1">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {(rating.allRaters ?? [rating]).slice(0, 4).map((r, i) => (
              r.userPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={r._id ?? i}
                  src={r.userPhoto}
                  alt={r.userName}
                  title={`${r.userName}: ${r.rating}`}
                  className={cn(
                    "w-7 h-7 rounded-full object-cover ring-2 ring-zinc-900",
                    r.userId === currentUserId && "ring-violet-500"
                  )}
                />
              ) : (
                <div
                  key={r._id ?? i}
                  title={`${r.userName}: ${r.rating}`}
                  className={cn(
                    "w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0 ring-2 ring-zinc-900",
                    r.userId === currentUserId && "ring-violet-500"
                  )}
                >
                  <span className="text-[10px] text-white font-bold">{r.userName?.[0]?.toUpperCase()}</span>
                </div>
              )
            ))}
            {(rating.allRaters?.length ?? 0) > 4 && (
              <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-900">
                <span className="text-[9px] text-zinc-400 font-bold">+{rating.allRaters.length - 4}</span>
              </div>
            )}
          </div>

          {/* Primary rater name + their score */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-zinc-300 truncate block">
              {myRating ? 'Моя оценка' : primaryRater.userName}
            </span>
          </div>

          {/* User's own score highlight */}
          {(myRating ?? primaryRater) && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-zinc-100">{(myRating ?? primaryRater).rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
