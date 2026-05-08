'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMovieDetails } from '@/hooks/useMovies'
import { getMovieRatings, getUserMovieRating, setRating, deleteRating } from '@/lib/firebase/ratings'
import { RatingStars } from '@/components/movie/RatingStars'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, Trash2, Star, Clock, Globe, CheckCircle, Film } from 'lucide-react'
import type { RatingDoc } from '@/types'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export default function MoviePage({ params }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [movieId, setMovieId] = useState<string | null>(null)
  const { movie, loading: movieLoading } = useMovieDetails(movieId)
  const [ratings, setRatings] = useState<(RatingDoc & { _id: string })[]>([])
  const [userRating, setUserRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ id }) => setMovieId(id))
  }, [params])

  const loadRatings = useCallback(async () => {
    if (!movieId) return
    const r = await getMovieRatings(Number(movieId))
    setRatings(r as (RatingDoc & { _id: string })[])
  }, [movieId])

  useEffect(() => {
    if (!movieId || !user) return
    loadRatings()
    getUserMovieRating(user.uid, Number(movieId)).then((r) => {
      if (r) {
        setUserRating(r.rating)
        setComment(r.comment)
        setExistingRatingId(r._id)
      }
    })
  }, [movieId, user, loadRatings])

  const handleSaveRating = async () => {
    if (!user || !movie || userRating === 0) return
    setSaving(true)
    try {
      await setRating(
        user.uid,
        user.displayName ?? '',
        user.photoURL ?? '',
        movie.id,
        userRating,
        comment,
        {
          title: movie.name ?? movie.alternativeName ?? '',
          poster: movie.poster?.url ?? movie.poster?.previewUrl ?? '',
          year: movie.year,
          genres: movie.genres?.map(g => g.name),
          kpRating: movie.rating?.kp,
          imdbRating: movie.rating?.imdb,
          description: movie.description
        }
      )
      await loadRatings()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Refresh existing rating id
      getUserMovieRating(user.uid, movie.id).then((r) => {
        if (r) setExistingRatingId(r._id)
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!user || !existingRatingId) return
    await deleteRating(existingRatingId)
    setUserRating(0)
    setComment('')
    setExistingRatingId(null)
    loadRatings()
  }

  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null

  if (movieLoading || !movie) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="flex gap-5">
          <Skeleton className="w-36 sm:w-44 aspect-[2/3] shrink-0 rounded-2xl" />
          <div className="flex-1 flex flex-col gap-3 pt-1">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full mt-2" />
          </div>
        </div>
      </div>
    )
  }

  const title = movie.name ?? movie.alternativeName ?? 'Unknown'
  const poster = movie.poster?.url ?? movie.poster?.previewUrl

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Movie info */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        {/* Poster */}
        <div className="shrink-0">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="w-36 sm:w-44 aspect-[2/3] object-cover rounded-2xl border border-zinc-800 shadow-2xl mx-auto sm:mx-0"
            />
          ) : (
            <div className="w-36 sm:w-44 aspect-[2/3] bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
              <Film className="w-10 h-10 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-1 leading-tight">{title}</h1>
          {movie.alternativeName && movie.alternativeName !== title && (
            <p className="text-zinc-400 text-sm mb-3">{movie.alternativeName}</p>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-4 text-sm text-zinc-400">
            {movie.year && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs">
                <Clock className="w-3 h-3" />
                {movie.year}
              </span>
            )}
            {movie.movieLength && (
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs">
                {movie.movieLength} мин
              </span>
            )}
            {movie.ageRating && (
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs font-semibold text-amber-400">
                {movie.ageRating}+
              </span>
            )}
            {movie.genres?.slice(0, 3).map((g) => (
              <span key={g.name} className="px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs">
                {g.name}
              </span>
            ))}
            {movie.countries?.[0] && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 text-xs">
                <Globe className="w-3 h-3" />
                {movie.countries[0].name}
              </span>
            )}
          </div>

          {/* External ratings */}
          <div className="flex gap-3 mb-5">
            {movie.rating?.kp != null && (
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 mb-0.5">Кинопоиск</span>
                <span className={cn(
                  'text-lg font-bold',
                  movie.rating.kp >= 7 ? 'text-emerald-400' :
                  movie.rating.kp >= 5 ? 'text-amber-400' : 'text-red-400'
                )}>
                  {movie.rating.kp.toFixed(1)}
                </span>
              </div>
            )}
            {movie.rating?.imdb != null && (
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 mb-0.5">IMDb</span>
                <span className="text-lg font-bold text-amber-400">{movie.rating.imdb.toFixed(1)}</span>
              </div>
            )}
            {avgRating && (
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-violet-900/30 border border-violet-800/30">
                <span className="text-[10px] text-violet-400 mb-0.5">Сообщество</span>
                <span className="text-lg font-bold text-violet-300">{avgRating}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {movie.description && (
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
              {movie.description}
            </p>
          )}
        </div>
      </div>

      {/* ─── Your rating ─── */}
      <section className="mb-8 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-100 mb-4">Ваша оценка</h2>

        <div className="flex flex-col gap-4">
          {/* Stars */}
          <div className="flex flex-col gap-2">
            <RatingStars value={userRating} onChange={setUserRating} size="lg" />
            {userRating > 0 && (
              <p className="text-xs text-zinc-500 ml-1">
                {userRating <= 2 ? 'Ужасно' :
                 userRating <= 4 ? 'Плохо' :
                 userRating <= 6 ? 'Нормально' :
                 userRating <= 8 ? 'Хорошо' : 'Отлично!'}
              </p>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ваше мнение о фильме (необязательно)..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
            rows={3}
          />

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            {existingRatingId ? (
              <button
                onClick={handleDeleteRating}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить оценку
              </button>
            ) : (
              <span />
            )}
            <Button
              onClick={handleSaveRating}
              loading={saving}
              disabled={userRating === 0}
              className={cn(saved && 'bg-emerald-600 hover:bg-emerald-600 border-emerald-500')}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Сохранено
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Сохранить оценку
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Community reviews ─── */}
      {ratings.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-zinc-100 mb-3">
            Отзывы ({ratings.length})
          </h2>
          <div className="flex flex-col gap-2.5">
            {ratings.map((r) => (
              <div key={r._id} className="flex gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                {r.userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.userPhoto} alt={r.userName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <span className="text-xs text-white font-bold">{r.userName?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-200">{r.userName}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 text-sm font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {r.rating}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-zinc-400 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
