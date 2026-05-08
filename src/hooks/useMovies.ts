'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMovie, searchMovies } from '@/lib/api/kinopoisk'
import type { KinopoiskMovie, KinopoiskSearchResponse } from '@/types'

export function useMovieDetails(id: number | string | null) {
  const [movie, setMovie] = useState<KinopoiskMovie | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    getMovie(id)
      .then(setMovie)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return { movie, loading, error }
}

export function useMovieSearch(query: string) {
  const [results, setResults] = useState<KinopoiskSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (q: string, page = 1) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setLoading(true)
    setError(null)

    searchMovies(q, page)
      .then(setResults)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    search(query)
  }, [query, search])

  return { results, loading, error, search }
}
