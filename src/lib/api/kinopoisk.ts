import type { KinopoiskMovie, KinopoiskSearchResponse } from '@/types'

const BASE_URL = 'https://api.poiskkino.dev/v1.4'

// Fallback to internal API if NEXT_PUBLIC keys are not provided
const INTERNAL_API_BASE = '/api/kinopoisk'

function getClientKeys(): string[] {
  return (process.env.NEXT_PUBLIC_KINOPOISK_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

async function fetchKinopoisk(endpoint: string, params?: URLSearchParams): Promise<Response> {
  const keys = getClientKeys()
  
  // If no public keys are exposed, fallback to our Next.js API route
  // (which might still be blocked on Vercel, but works locally without exposing keys)
  if (keys.length === 0) {
    const url = `${INTERNAL_API_BASE}${endpoint}${params ? `?${params.toString()}` : ''}`
    return fetch(url)
  }

  const url = `${BASE_URL}${endpoint}${params ? `?${params.toString()}` : ''}`
  let lastError: Error | null = null

  // Try each key for rate limits (429)
  for (const key of keys) {
    const res = await fetch(url, {
      headers: { 'X-API-KEY': key },
    })
    if (res.status !== 429) return res
    lastError = new Error(`Rate limited on key ending ...${key.slice(-4)}`)
  }
  
  throw lastError ?? new Error('All Kinopoisk keys exhausted')
}

export async function searchMovies(
  query: string,
  page = 1,
  limit = 20
): Promise<KinopoiskSearchResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    page: String(page)
  })
  
  const res = await fetchKinopoisk('/movie/search', params)
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

export async function getMovie(id: number | string): Promise<KinopoiskMovie> {
  const res = await fetchKinopoisk(`/movie/${id}`)
  if (!res.ok) throw new Error(`Movie fetch failed: ${res.status}`)
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

  const res = await fetchKinopoisk('/random', params)
  if (!res.ok) throw new Error(`Random movie fetch failed: ${res.status}`)
  return res.json()
}
