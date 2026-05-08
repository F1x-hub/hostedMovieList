import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.kinopoisk.dev/v1.4'

function getKeys(): string[] {
  return (process.env.KINOPOISK_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
}

async function fetchWithRotation(url: string): Promise<Response> {
  const keys = getKeys()
  if (keys.length === 0) throw new Error('No KINOPOISK_API_KEYS configured')

  let lastError: Error | null = null
  for (const key of keys) {
    const res = await fetch(url, { headers: { 'X-API-KEY': key } })
    if (res.status !== 429) return res
    lastError = new Error(`Rate limited on key ending ...${key.slice(-4)}`)
  }
  throw lastError ?? new Error('All Kinopoisk keys exhausted')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const genres = searchParams.get('genres.name')
  const yearFrom = searchParams.get('year.from')
  const yearTo = searchParams.get('year.to')

  let url = `${BASE_URL}/movie/random?notNullFields=name&notNullFields=poster.url`
  if (genres) url += `&genres.name=${encodeURIComponent(genres)}`
  if (yearFrom) url += `&year.from=${yearFrom}`
  if (yearTo) url += `&year.to=${yearTo}`

  try {
    const res = await fetchWithRotation(url)

    if (!res.ok) {
      return NextResponse.json({ error: 'Kinopoisk API error', status: res.status }, { status: res.status })
    }

    const data = await res.json()
    // No cache for random — always fresh
    return NextResponse.json(data)
  } catch (err) {
    console.error('[kinopoisk/random]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
