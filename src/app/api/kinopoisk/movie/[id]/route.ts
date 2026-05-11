import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.poiskkino.dev/v1.4'

function getKeys(): string[] {
  return (process.env.KINOPOISK_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
}

async function fetchWithRotation(url: string): Promise<Response> {
  const keys = getKeys()
  if (keys.length === 0) throw new Error('No KINOPOISK_API_KEYS configured')

  let lastError: Error | null = null
  for (const key of keys) {
    const res = await fetch(url, {
      headers: { 'X-API-KEY': key },
      next: { revalidate: 3600 },
    })
    if (res.status !== 429) return res
    lastError = new Error(`Rate limited on key ending ...${key.slice(-4)}`)
  }
  throw lastError ?? new Error('All Kinopoisk keys exhausted')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const url = `${BASE_URL}/movie/${id}`
    const res = await fetchWithRotation(url)

    if (!res.ok) {
      return NextResponse.json({ error: 'Movie not found', status: res.status }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    })
  } catch (err) {
    console.error('[kinopoisk/movie]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
