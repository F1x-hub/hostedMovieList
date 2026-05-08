import type { KinopoiskMovie, KinopoiskSearchResponse } from '@/types'

const API_BASE = '/api/kinopoisk'

export async function searchMovies(
  query: string,
  page = 1,
  limit = 20
): Promise<KinopoiskSearchResponse> {
  const url = `${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

export async function getMovie(id: number | string): Promise<KinopoiskMovie> {
  const res = await fetch(`${API_BASE}/movie/${id}`)
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

  const qs = params.toString()
  const res = await fetch(`${API_BASE}/random${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`Random movie fetch failed: ${res.status}`)
  return res.json()
}
