import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.poiskkino.dev/v1.4'

function getKeys(): string[] {
  const raw = process.env.KINOPOISK_API_KEYS ?? ''
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean)
  console.log(`[kinopoisk/search] Found ${keys.length} API key(s)`)
  return keys
}

async function fetchWithRotation(url: string): Promise<Response> {
  const keys = getKeys()
  if (keys.length === 0) {
    console.error('[kinopoisk/search] ERROR: No KINOPOISK_API_KEYS configured in environment!')
    throw new Error('No KINOPOISK_API_KEYS configured')
  }

  let lastError: Error | null = null
  for (const key of keys) {
    const maskedKey = `...${key.slice(-4)}`
    console.log(`[kinopoisk/search] Trying key ${maskedKey} → ${url}`)
    const res = await fetch(url, {
      headers: { 'X-API-KEY': key },
      next: { revalidate: 300 },
    })
    console.log(`[kinopoisk/search] Key ${maskedKey} → status ${res.status}`)
    if (res.status !== 429) return res
    lastError = new Error(`Rate limited on key ending ${maskedKey}`)
    console.warn(`[kinopoisk/search] 429 rate limit on key ${maskedKey}, trying next...`)
  }
  throw lastError ?? new Error('All Kinopoisk keys exhausted')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('query')
  const limit = searchParams.get('limit') ?? '10'
  const page = searchParams.get('page') ?? '1'

  console.log(`[kinopoisk/search] GET called: query="${query}" limit=${limit} page=${page}`)

  if (!query) {
    return NextResponse.json({ error: 'query parameter is required' }, { status: 400 })
  }

  try {
    const url = `${BASE_URL}/movie/search?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
    console.log(`[kinopoisk/search] Fetching: ${url}`)
    const res = await fetchWithRotation(url)

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[kinopoisk/search] Upstream error ${res.status}: ${body}`)
      return NextResponse.json(
        { error: 'Kinopoisk API error', status: res.status, detail: body },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log(`[kinopoisk/search] Success: returned ${data?.docs?.length ?? 0} results`)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[kinopoisk/search] Exception:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
