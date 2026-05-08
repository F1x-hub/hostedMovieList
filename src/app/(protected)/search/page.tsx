'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { MovieGrid } from '@/components/movie/MovieGrid'
import { useDebounce } from '@/hooks/useDebounce'
import { useMovieSearch } from '@/hooks/useMovies'

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  useEffect(() => {
    const q = searchParams.get('q')
    if (q !== null) setQuery(q)
  }, [searchParams])

  const debouncedQuery = useDebounce(query, 400)
  const { results, loading } = useMovieSearch(debouncedQuery)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">Поиск фильмов</h1>
        <Input
          id="search-input"
          type="search"
          placeholder="Название фильма..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          autoFocus
          className="text-base py-3"
        />
      </div>

      {!debouncedQuery ? (
        <div className="flex flex-col items-center gap-3 py-20 text-zinc-500">
          <Search className="w-12 h-12 opacity-20" />
          <p className="text-sm">Начните вводить название фильма</p>
        </div>
      ) : (
        <>
          {results && !loading && (
            <p className="text-xs text-zinc-500 mb-4">
              Найдено: {results.total} результатов
            </p>
          )}
          <MovieGrid
            movies={results?.docs ?? []}
            loading={loading}
            emptyMessage="Ничего не найдено по вашему запросу"
          />
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
