import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.kinopoisk.dev/v1.4'

function getKeys(): string[] {
  return (process.env.KINOPOISK_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
}

async function fetchWithRotation(url: string): Promise<Response> {
  const keys = getKeys()
  if (keys.length === 0) {
    throw new Error('No KINOPOISK_API_KEYS configured')
  }

  let lastError: Error | null = null
  for (const key of keys) {
    const res = await fetch(url, {
      headers: { 'X-API-KEY': key },
      next: { revalidate: 300 },
    })
    if (res.status !== 429) return res
    lastError = new Error(`Rate limited on key ending ...${key.slice(-4)}`)
  }
  throw lastError ?? new Error('All Kinopoisk keys exhausted')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('query')
  const limit = searchParams.get('limit') ?? '10'
  const page = searchParams.get('page') ?? '1'

  if (!query) {
    return NextResponse.json({ error: 'query parameter is required' }, { status: 400 })
  }

  try {
    const url = `${BASE_URL}/movie/search?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
    const res = await fetchWithRotation(url)

    if (!res.ok) {
      return NextResponse.json({ error: 'Kinopoisk API error', status: res.status }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[kinopoisk/search]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
