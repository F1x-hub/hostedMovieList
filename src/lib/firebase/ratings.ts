import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  limit,
  startAfter,
} from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import { db } from './index'
import type { RatingDoc } from '@/types'

// ─────────────────────────────────────────────────────────────────
//  ALL ratings (all users) — same as extension's getAllRatings()
//  Groups by movieId, returns one entry per movie with allRaters[]
// ─────────────────────────────────────────────────────────────────
export interface GroupedRating extends RatingDoc {
  _id: string
  allRaters: (RatingDoc & { _id: string })[]
  averageRating: number
  ratingsCount: number
}

export async function getAllRatings(maxDocs = 500): Promise<GroupedRating[]> {
  console.log('[ratings] getAllRatings → fetching up to', maxDocs, 'docs')
  // No orderBy — done client-side to avoid composite index requirement
  const q = query(
    collection(db, 'ratings'),
    limit(maxDocs)
  )
  const snap = await getDocs(q)
  const raw = snap.docs.map((d) => ({ ...d.data(), _id: d.id } as unknown as RatingDoc & { _id: string }))

  console.log(`[ratings] getAllRatings → raw docs: ${raw.length}`)

  // Group by movieId — same logic as extension
  const getTs = (d: any) => {
    if (!d) return 0
    if (d.toDate) return d.toDate().getTime()
    if (d.toMillis) return d.toMillis()
    if (d.seconds) return d.seconds * 1000
    return new Date(d).getTime() || 0
  }

  const map = new Map<number | string, GroupedRating>()

  raw.forEach((r) => {
    if (!map.has(r.movieId)) {
      map.set(r.movieId, { ...r, allRaters: [r], averageRating: 0, ratingsCount: 0 })
    } else {
      const existing = map.get(r.movieId)!
      existing.allRaters.push(r)
      // keep the most-recent rater as the "primary" entry
      if (getTs(r.createdAt) > getTs(existing.createdAt)) {
        map.set(r.movieId, { ...r, allRaters: existing.allRaters, averageRating: 0, ratingsCount: 0 })
      }
    }
  })

  const grouped = Array.from(map.values())

  // Calculate average rating per movie
  grouped.forEach((g) => {
    const sum = g.allRaters.reduce((s, r) => s + (r.rating || 0), 0)
    g.averageRating = g.allRaters.length > 0 ? Math.round((sum / g.allRaters.length) * 10) / 10 : 0
    g.ratingsCount = g.allRaters.length
    // sort raters oldest-first (like extension)
    g.allRaters.sort((a, b) => getTs(a.createdAt) - getTs(b.createdAt))
  })

  // Sort groups by most-recent createdAt desc
  grouped.sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt))

  console.log(`[ratings] getAllRatings → grouped into ${grouped.length} unique movies`)
  grouped.forEach((g) => {
    console.log(`[ratings]   movieId=${g.movieId} title="${g.movieTitle ?? '⚠️ NO TITLE'}" raters=${g.ratingsCount} avg=${g.averageRating}`)
  })

  return grouped
}

// ─────────────────────────────────────────────────────────────────
//  PAGINATED ratings (for feed infinite scroll)
// ─────────────────────────────────────────────────────────────────
export async function getPaginatedRatings(targetMovieCount: number, initialLastDoc: DocumentSnapshot | null = null) {
  let currentLastDoc = initialLastDoc
  let hasMore = true
  
  const allDocs: (RatingDoc & { _id: string })[] = []
  const seenMovies = new Set<string | number>()
  
  // We'll fetch in batches of 15 ratings to minimize roundtrips while searching for unique movies
  const FETCH_BATCH_SIZE = 15
  
  while (seenMovies.size < targetMovieCount && hasMore) {
    let q = query(
      collection(db, 'ratings'),
      orderBy('createdAt', 'desc'),
      limit(FETCH_BATCH_SIZE)
    )

    if (currentLastDoc) {
      q = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'desc'),
        startAfter(currentLastDoc),
        limit(FETCH_BATCH_SIZE)
      )
    }

    const snap = await getDocs(q)
    const docs = snap.docs.map((d) => ({ ...d.data(), _id: d.id } as unknown as RatingDoc & { _id: string }))
    
    if (docs.length === 0) {
      hasMore = false
      break
    }

    let acceptedCountInBatch = 0
    
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i]
      if (!seenMovies.has(d.movieId)) {
        if (seenMovies.size >= targetMovieCount) {
          // We reached the limit exactly before this doc.
          break
        }
        seenMovies.add(d.movieId)
      }
      allDocs.push(d)
      acceptedCountInBatch++
    }

    if (acceptedCountInBatch < docs.length) {
      // We broke early because we hit the movie count limit
      currentLastDoc = snap.docs[acceptedCountInBatch - 1]
      hasMore = true
      break
    } else {
      // We accepted all docs in this batch
      currentLastDoc = snap.docs[snap.docs.length - 1]
      if (docs.length < FETCH_BATCH_SIZE) {
        hasMore = false
      }
    }
  }

  if (allDocs.length === 0) {
    return { groupedRatings: [], lastDoc: null, hasMore: false }
  }

  const movieIds = Array.from(seenMovies)

  // Fetch all ratings for these movies to calculate averages and get all raters
  const allRatingsForMovies: (RatingDoc & { _id: string })[] = []
  
  for (let i = 0; i < movieIds.length; i += 30) {
    const chunk = movieIds.slice(i, i + 30)
    const chunkQuery = query(
      collection(db, 'ratings'),
      where('movieId', 'in', chunk)
    )
    const chunkSnap = await getDocs(chunkQuery)
    chunkSnap.docs.forEach(d => {
      allRatingsForMovies.push({ ...d.data(), _id: d.id } as unknown as RatingDoc & { _id: string })
    })
  }

  // Group by movieId (same logic as getAllRatings)
  const getTs = (d: any) => {
    if (!d) return 0
    if (d.toDate) return d.toDate().getTime()
    if (d.toMillis) return d.toMillis()
    if (d.seconds) return d.seconds * 1000
    return new Date(d).getTime() || 0
  }

  const map = new Map<number | string, GroupedRating>()

  allRatingsForMovies.forEach((r) => {
    if (!map.has(r.movieId)) {
      map.set(r.movieId, { ...r, allRaters: [r], averageRating: 0, ratingsCount: 0 })
    } else {
      const existing = map.get(r.movieId)!
      existing.allRaters.push(r)
      if (getTs(r.createdAt) > getTs(existing.createdAt)) {
        map.set(r.movieId, { ...r, allRaters: existing.allRaters, averageRating: 0, ratingsCount: 0 })
      }
    }
  })

  const grouped = Array.from(map.values())

  grouped.forEach((g) => {
    const sum = g.allRaters.reduce((s, r) => s + (r.rating || 0), 0)
    g.averageRating = g.allRaters.length > 0 ? Math.round((sum / g.allRaters.length) * 10) / 10 : 0
    g.ratingsCount = g.allRaters.length
    g.allRaters.sort((a, b) => getTs(a.createdAt) - getTs(b.createdAt))
  })

  // Preserve the descending createdAt order from the original query.
  const orderedGrouped: GroupedRating[] = []
  const finalSeenMovies = new Set<string | number>()
  
  for (const d of allDocs) {
    if (!finalSeenMovies.has(d.movieId)) {
      finalSeenMovies.add(d.movieId)
      const group = map.get(d.movieId)
      if (group) {
        orderedGrouped.push(group)
      }
    }
  }

  return {
    groupedRatings: orderedGrouped,
    lastDoc: currentLastDoc,
    hasMore
  }
}


// ─────────────────────────────────────────────────────────────────
//  Current user's own ratings (for "my ratings" filter)
// ─────────────────────────────────────────────────────────────────
export async function getUserRatings(userId: string): Promise<RatingDoc[]> {
  console.log('[ratings] getUserRatings → userId:', userId)
  const q = query(
    collection(db, 'ratings'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ ...d.data(), _id: d.id } as unknown as RatingDoc))

  console.log(`[ratings] getUserRatings → found ${docs.length} records`)
  docs.forEach((r: any) => {
    console.log(`[ratings]   id=${r._id} movieId=${r.movieId} title="${r.movieTitle ?? '⚠️ NO TITLE'}" poster="${r.posterPath ? '✅ OK' : '⚠️ NO POSTER'}" rating=${r.rating}`)
  })

  return docs
}

export async function getMovieRatings(movieId: number | string): Promise<RatingDoc[]> {
  console.log('[ratings] getMovieRatings → movieId:', movieId)
  const q = query(
    collection(db, 'ratings'),
    where('movieId', '==', movieId)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ ...d.data(), _id: d.id } as unknown as RatingDoc))
  console.log(`[ratings] getMovieRatings → found ${docs.length} records for movieId=${movieId}`)
  return docs
}

export async function getUserMovieRating(
  userId: string,
  movieId: number | string
): Promise<(RatingDoc & { _id: string }) | null> {
  console.log('[ratings] getUserMovieRating → userId:', userId, 'movieId:', movieId)
  const q = query(
    collection(db, 'ratings'),
    where('userId', '==', userId),
    where('movieId', '==', movieId)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    console.log('[ratings] getUserMovieRating → no existing rating')
    return null
  }
  const d = snap.docs[0]
  const result = { ...d.data(), _id: d.id } as unknown as RatingDoc & { _id: string }
  console.log('[ratings] getUserMovieRating → found:', result)
  return result
}

export async function setRating(
  userId: string,
  userName: string,
  userPhoto: string,
  movieId: number | string,
  rating: number,
  comment: string,
  movieInfo?: {
    title?: string
    poster?: string
    year?: number
    genres?: string[]
    kpRating?: number
    imdbRating?: number
    description?: string
  }
): Promise<void> {
  console.log('[ratings] setRating → movieId:', movieId, 'rating:', rating)
  console.log('[ratings] setRating → movieInfo:', JSON.stringify(movieInfo))

  const existing = await getUserMovieRating(userId, movieId)

  const data: any = {
    userId,
    userName,
    userPhoto,
    movieId,
    rating,
    comment,
    updatedAt: serverTimestamp(),
  }

  if (movieInfo) {
    if (movieInfo.title) data.movieTitle = movieInfo.title
    if (movieInfo.poster) data.posterPath = movieInfo.poster
    if (movieInfo.year) data.releaseYear = movieInfo.year
    if (movieInfo.genres) data.genres = movieInfo.genres
    if (movieInfo.kpRating != null) data.kpRating = movieInfo.kpRating
    if (movieInfo.imdbRating != null) data.imdbRating = movieInfo.imdbRating
    if (movieInfo.description) data.description = movieInfo.description
  } else {
    console.warn('[ratings] setRating ⚠️ No movieInfo provided — title/poster will NOT be saved!')
  }

  console.log('[ratings] setRating → final data to write:', JSON.stringify({
    ...data,
    updatedAt: '(serverTimestamp)',
  }))

  if (existing) {
    console.log('[ratings] setRating → updating existing doc:', existing._id)
    await updateDoc(doc(db, 'ratings', existing._id), data)
  } else {
    console.log('[ratings] setRating → creating new doc')
    data.createdAt = serverTimestamp()
    await addDoc(collection(db, 'ratings'), data)
  }

  console.log('[ratings] setRating → ✅ done')
}

export async function deleteRating(ratingId: string): Promise<void> {
  console.log('[ratings] deleteRating → id:', ratingId)
  await deleteDoc(doc(db, 'ratings', ratingId))
  console.log('[ratings] deleteRating → ✅ done')
}
