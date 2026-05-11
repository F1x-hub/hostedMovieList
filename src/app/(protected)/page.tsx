'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPaginatedRatings, deleteRating } from '@/lib/firebase/ratings'
import type { GroupedRating } from '@/lib/firebase/ratings'
import type { DocumentSnapshot } from 'firebase/firestore'
import { RatedMovieCard } from '@/components/movie/RatedMovieCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Star, Search, ArrowUpDown, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'date' | 'rating'

const PAGE_SIZE = 6

// ── Cache helpers (mirroring the Chrome extension logic) ──────────────────────

/** Per-film metadata key — shared across all pages (same as extension: kp_movie_{id}) */
const movieKey = (movieId: string | number) => `kp_movie_${movieId}`

// ─────────────────────────────────────────────────────────────────────────────

/** Read per-film metadata from localStorage (never expires — movie data rarely changes) */
function readMovieCache(movieId: string | number) {
  try {
    const raw = localStorage.getItem(movieKey(movieId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Write per-film metadata to localStorage */
function writeMovieCache(movieId: string | number, data: object) {
  try {
    localStorage.setItem(movieKey(movieId), JSON.stringify(data))
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Enrich a single rating with movie metadata.
 * 1. First tries localStorage (kp_movie_{id}) — free, instant.
 * 2. Falls back to /api/kinopoisk and then saves result to localStorage for future use.
 */
async function enrichRating(r: GroupedRating): Promise<GroupedRating> {
  // Already fully enriched
  if (r.movieTitle && r.posterPath) return r
  if (!r.movieId) return r

  // 1. Try localStorage cache
  const cached = readMovieCache(r.movieId)
  if (cached) {
    return {
      ...r,
      movieTitle: cached.name ?? cached.alternativeName ?? r.movieTitle,
      posterPath: cached.posterUrl ?? r.posterPath,
      releaseYear: cached.year ?? r.releaseYear,
      genres: cached.genres ?? r.genres,
      kpRating: cached.kpRating ?? r.kpRating,
      imdbRating: cached.imdbRating ?? r.imdbRating,
      description: cached.description ?? r.description,
    }
  }

  // 2. Fetch from Kinopoisk API
  try {
    const res = await fetch(`/api/kinopoisk/movie/${r.movieId}`)
    if (!res.ok) return r
    const movie = await res.json()

    const title = movie.name ?? movie.alternativeName
    const poster = movie.poster?.url ?? movie.poster?.previewUrl
    const genres = movie.genres?.map((g: { name: string }) => g.name) ?? []

    // Save to per-film localStorage so every other page can use it without API call
    writeMovieCache(r.movieId, {
      name: title,
      posterUrl: poster,
      year: movie.year,
      genres,
      description: movie.description,
      kpRating: movie.rating?.kp,
      imdbRating: movie.rating?.imdb,
    })

    return {
      ...r,
      movieTitle: title ?? r.movieTitle,
      posterPath: poster ?? r.posterPath,
      releaseYear: movie.year ?? r.releaseYear,
      genres: genres.length ? genres : r.genres,
      kpRating: movie.rating?.kp ?? r.kpRating,
      imdbRating: movie.rating?.imdb ?? r.imdbRating,
      description: movie.description ?? r.description,
    }
  } catch {
    return r
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()

  const [allRatings, setAllRatings] = useState<GroupedRating[]>([])
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)

  // Pagination state
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const [sort, setSort] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Main loader ────────────────────────────────────────────────────────────
  const loadRatings = useCallback(async (isLoadMore = false, forceRefresh = false) => {
    if (!user) return
    if (isLoadMore && (!hasMore || loadingMore)) return

    if (!isLoadMore) setLoading(true)
    else setLoadingMore(true)

    try {
      const currentLastDoc = isLoadMore ? lastDoc : null
      
      const { groupedRatings: raw, lastDoc: nextLastDoc, hasMore: nextHasMore } = 
        await getPaginatedRatings(PAGE_SIZE, currentLastDoc)

      setLastDoc(nextLastDoc)
      setHasMore(nextHasMore)

      // 3. Quick-enrich from per-film localStorage (free, instant)
      const quickEnriched = raw.map(r => {
        const cached = readMovieCache(r.movieId)
        if (!cached) return r
        return {
          ...r,
          movieTitle: cached.name ?? cached.alternativeName ?? r.movieTitle,
          posterPath: cached.posterUrl ?? r.posterPath,
          releaseYear: cached.year ?? r.releaseYear,
          genres: cached.genres ?? r.genres,
          kpRating: cached.kpRating ?? r.kpRating,
          imdbRating: cached.imdbRating ?? r.imdbRating,
          description: cached.description ?? r.description,
        }
      })

      setAllRatings(prev => {
        if (!isLoadMore) return quickEnriched
        
        // Deduplicate in case a movie spans multiple pages
        const existingIds = new Set(prev.map(r => r.movieId))
        const newUnique = quickEnriched.filter(r => !existingIds.has(r.movieId))
        return [...prev, ...newUnique]
      })

      if (!isLoadMore) setLoading(false)
      else setLoadingMore(false)

      // 4. Enrich remaining records (missing poster/title) via API
      const needsEnrich = quickEnriched.filter(r => !r.movieTitle || !r.posterPath)
      if (needsEnrich.length === 0) return

      setEnriching(true)
      const BATCH = 10
      let current = [...quickEnriched]
      for (let i = 0; i < quickEnriched.length; i += BATCH) {
        const batch = quickEnriched.slice(i, i + BATCH)
        const enriched = await Promise.all(batch.map(r => enrichRating(r)))
        
        current = current.map((r, idx) => {
          const bi = idx - i
          return bi >= 0 && bi < BATCH ? enriched[bi] : r
        })

        setAllRatings(prev => {
           // Map updates back to main array
           const updated = [...prev]
           current.forEach(cr => {
             const idx = updated.findIndex(u => u.movieId === cr.movieId)
             if (idx !== -1) updated[idx] = cr
           })
           return updated
        })
      }
      setEnriching(false)

    } catch (err) {
      console.error('[home] loadRatings error:', err)
      if (!isLoadMore) setLoading(false)
      else setLoadingMore(false)
    }
  }, [user, hasMore, loadingMore, lastDoc])

  useEffect(() => {
    if (user) loadRatings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { 
        if (entries[0].isIntersecting) {
          loadRatings(true)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, loadingMore, hasMore, loadRatings])

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sorted = [...allRatings].sort((a, b) => {
    const dir = sortDir === 'desc' ? -1 : 1
    if (sort === 'rating') return (a.averageRating - b.averageRating) * dir
    const ts = (d: any) => d?.seconds ? d.seconds * 1000 : 0
    return (ts(a.createdAt) - ts(b.createdAt)) * dir
  })

  const visible = sorted

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(key); setSortDir('desc') }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!user) return
    setDeletingId(id)
    const updated = allRatings.filter(r => r._id !== id)
    setAllRatings(updated)
    await deleteRating(id)
    setDeletingId(null)
  }

  const avg = allRatings.length
    ? (allRatings.reduce((s, r) => s + r.averageRating, 0) / allRatings.length).toFixed(1)
    : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-100 tracking-tight mb-2">Дневник просмотров</h1>
          {!loading && allRatings.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-medium">
                Показано фильмов: <span className="text-zinc-100">{allRatings.length}</span>
              </div>
              {enriching ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Загружаю постеры...
                </div>
              ) : (
                <button
                  onClick={() => loadRatings(false, true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Принудительно обновить из базы данных"
                >
                  <RefreshCw className="w-3 h-3" />
                  Обновить
                </button>
              )}
            </div>
          )}
        </div>

        {allRatings.length > 0 && !loading && (
          <div className="flex gap-2 shrink-0 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
            {(['date', 'rating'] as SortKey[]).map((key) => (
              <Button
                key={key}
                variant={sort === key ? 'primary' : 'secondary'}
                size="sm"
                className={cn(
                  "rounded-xl h-9 px-4 text-xs font-bold transition-all",
                  sort === key ? "shadow-lg shadow-violet-500/20" : "bg-transparent border-transparent text-zinc-500"
                )}
                onClick={() => toggleSort(key)}
              >
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                {key === 'date' ? 'По дате' : 'По оценке'}
                {sort === key && (
                  <span className="ml-1 opacity-60">{sortDir === 'desc' ? '↓' : '↑'}</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-[460px] rounded-3xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-32 text-zinc-500">
          <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
            <Star className="w-10 h-10 text-zinc-800" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-200 mb-2">Ещё ничего не оценено</h2>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Самое время найти интересный фильм и поставить ему заслуженную оценку
            </p>
          </div>
          <Link href="/search">
            <Button size="lg" className="rounded-2xl px-8 h-12 font-bold shadow-xl shadow-violet-500/20">
              <Search className="w-4 h-4 mr-2" />
              Найти первый фильм
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((rating) => (
              <div key={rating._id} className="relative group/item">
                <RatedMovieCard rating={rating} currentUserId={user?.uid} />
                {rating.allRaters.some(r => r.userId === user?.uid) && (
                  <button
                    onClick={() => handleDelete(rating._id)}
                    disabled={deletingId === rating._id}
                    className="absolute top-12 right-3 z-30 opacity-0 group-hover/item:opacity-100 transition-all p-2 rounded-xl text-white hover:bg-red-500 bg-black/40 backdrop-blur-md border border-white/10"
                    title="Удалить оценку"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="mt-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <Skeleton key={i} className="h-[460px] rounded-3xl opacity-50" />
                ))}
              </div>
            </div>
          )}

          {!hasMore && allRatings.length > PAGE_SIZE && (
            <p className="text-center text-zinc-600 text-sm mt-10">
              Все {allRatings.length} фильмов загружены
            </p>
          )}
        </>
      )}
    </div>
  )
}
