'use client'

import { useState } from 'react'
import { getRandomMovie } from '@/lib/api/kinopoisk'
import { addToList } from '@/lib/firebase/watchlist'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Shuffle, BookMarked, Eye, Heart, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import type { KinopoiskMovie } from '@/types'

const GENRES = [
  'аниме', 'биография', 'боевик', 'вестерн', 'документальный',
  'драма', 'история', 'комедия', 'криминал', 'мелодрама',
  'мультфильм', 'мюзикл', 'приключения', 'семейный', 'триллер',
  'ужасы', 'фантастика', 'фэнтези', 'эротика',
]

export default function RandomPage() {
  const { user } = useAuth()
  const [movie, setMovie] = useState<KinopoiskMovie | null>(null)
  const [loading, setLoading] = useState(false)
  const [genre, setGenre] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [addedToList, setAddedToList] = useState<string | null>(null)

  const handleRandom = async () => {
    setLoading(true)
    setMovie(null)
    setAddedToList(null)
    try {
      const result = await getRandomMovie({
        genre: genre || undefined,
        yearFrom: yearFrom ? Number(yearFrom) : undefined,
        yearTo: yearTo ? Number(yearTo) : undefined,
      })
      setMovie(result)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async (listType: 'watchlist' | 'watching' | 'favorites') => {
    if (!user || !movie) return
    await addToList(user.uid, listType, {
      movieId: movie.id,
      movieTitle: movie.name ?? '',
      movieTitleRu: movie.name ?? '',
      posterPath: movie.poster?.url ?? '',
      releaseYear: movie.year ?? 0,
      genres: movie.genres?.map((g) => g.name) ?? [],
      description: movie.description ?? '',
      kpRating: movie.rating?.kp ?? 0,
      imdbRating: movie.rating?.imdb ?? 0,
    })
    setAddedToList(listType)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Случайный фильм</h1>
      <p className="text-zinc-400 text-sm mb-8">Не знаете что посмотреть? Мы выберем за вас.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Любой жанр</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        <input
          type="number"
          placeholder="Год от"
          value={yearFrom}
          onChange={(e) => setYearFrom(e.target.value)}
          min={1900}
          max={2030}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          type="number"
          placeholder="Год до"
          value={yearTo}
          onChange={(e) => setYearTo(e.target.value)}
          min={1900}
          max={2030}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <Button size="lg" onClick={handleRandom} loading={loading} className="mb-8 w-full sm:w-auto">
        <Shuffle className="w-5 h-5" />
        Выбрать случайный фильм
      </Button>

      {loading && (
        <div className="flex gap-6">
          <Skeleton className="w-40 aspect-[2/3] rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {movie && !loading && (
        <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 animate-slide-up">
          <div className="shrink-0">
            {movie.poster?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.poster.url}
                alt={movie.name ?? ''}
                loading="lazy"
                className="w-full sm:w-40 aspect-[2/3] object-cover rounded-xl"
              />
            ) : (
              <div className="w-full sm:w-40 aspect-[2/3] bg-zinc-800 rounded-xl" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/movie/${movie.id}`} className="hover:underline">
              <h2 className="text-xl font-bold text-zinc-100 mb-1">
                {movie.name ?? movie.alternativeName}
              </h2>
            </Link>
            <p className="text-sm text-zinc-400 mb-2">
              {movie.year} · {movie.genres?.slice(0, 2).map((g) => g.name).join(', ')}
            </p>

            {movie.rating?.kp && (
              <div className="flex items-center gap-1 mb-4 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                {movie.rating.kp.toFixed(1)} КП
              </div>
            )}

            {movie.description && (
              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 mb-4">
                {movie.description}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              {([
                { type: 'watchlist' as const, Icon: BookMarked, label: 'Хочу смотреть' },
                { type: 'watching' as const, Icon: Eye, label: 'Смотрю' },
                { type: 'favorites' as const, Icon: Heart, label: 'Избранное' },
              ]).map(({ type, Icon, label }) => (
                <Button
                  key={type}
                  variant={addedToList === type ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleAddToList(type)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
