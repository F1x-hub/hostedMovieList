import type { KinopoiskMovie, KinopoiskSearchResponse } from '@/types'

// All requests go through our Next.js API routes (server-side proxy).
// Direct browser→Kinopoisk calls are blocked by CORS.
const API_BASE = '/api/kinopoisk'

export async function searchMovies(
  query: string,
  page = 1,
  limit = 20
): Promise<KinopoiskSearchResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    page: String(page),
  })
  const url = `${API_BASE}/search?${params.toString()}`
  console.log('[kinopoisk client] searchMovies →', url)

  const res = await fetch(url)
  console.log('[kinopoisk client] searchMovies response status:', res.status)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[kinopoisk client] searchMovies error body:', body)
    throw new Error(`Search failed: ${res.status}`)
  }
  return res.json()
}

export async function getMovie(id: number | string): Promise<KinopoiskMovie> {
  const url = `${API_BASE}/movie/${id}`
  console.log('[kinopoisk client] getMovie →', url)

  const res = await fetch(url)
  console.log('[kinopoisk client] getMovie response status:', res.status)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[kinopoisk client] getMovie error body:', body)
    throw new Error(`Movie fetch failed: ${res.status}`)
  }
  return res.json()
}

export async function getRandomMovie(filters?: {
  genre?: string
  yearFrom?: number
  yearTo?: number
}): Promise<KinopoiskMovie> {
  const params = new URLSearchParams()
  if (filters?.genre) params.set('genres.name', filters.genre)
  if (filters?.yearFrom) params.set('year.from', String(filters.yearFrom))
  if (filters?.yearTo) params.set('year.to', String(filters.yearTo))

  const qs = params.toString()
  const url = `${API_BASE}/random${qs ? `?${qs}` : ''}`
  console.log('[kinopoisk client] getRandomMovie →', url)

  const res = await fetch(url)
  console.log('[kinopoisk client] getRandomMovie response status:', res.status)
  if (!res.ok) throw new Error(`Random movie fetch failed: ${res.status}`)
  return res.json()
}
