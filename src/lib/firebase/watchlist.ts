import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './index'
import type { WatchlistDoc, WatchlistType } from '@/types'

export async function getList(
  userId: string,
  listType: WatchlistType
): Promise<(WatchlistDoc & { _id: string })[]> {
  const q = query(
    collection(db, listType),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    ...d.data(),
    _id: d.id,
  })) as (WatchlistDoc & { _id: string })[]
}

export async function addToList(
  userId: string,
  listType: WatchlistType,
  movieData: Omit<WatchlistDoc, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  // Remove from other lists first (a movie should only be in one status list)
  await removeFromAllLists(userId, movieData.movieId)

  await addDoc(collection(db, listType), {
    userId,
    ...movieData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function removeFromList(
  userId: string,
  listType: WatchlistType,
  movieId: number | string
): Promise<void> {
  const q = query(
    collection(db, listType),
    where('userId', '==', userId),
    where('movieId', '==', movieId)
  )
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    await deleteDoc(doc(db, listType, d.id))
  }
}

export async function removeFromAllLists(
  userId: string,
  movieId: number | string
): Promise<void> {
  const lists: WatchlistType[] = ['watchlist', 'watching', 'favorites']
  for (const list of lists) {
    await removeFromList(userId, list, movieId)
  }
}

export async function getMovieListStatus(
  userId: string,
  movieId: number | string
): Promise<WatchlistType | null> {
  const lists: WatchlistType[] = ['watchlist', 'watching', 'favorites']
  for (const list of lists) {
    const q = query(
      collection(db, list),
      where('userId', '==', userId),
      where('movieId', '==', movieId)
    )
    const snap = await getDocs(q)
    if (!snap.empty) return list
  }
  return null
}

export async function moveToList(
  userId: string,
  fromList: WatchlistType,
  toList: WatchlistType,
  movieId: number | string,
  movieData: Omit<WatchlistDoc, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  await removeFromList(userId, fromList, movieId)
  await addDoc(collection(db, toList), {
    userId,
    ...movieData,
    movedFrom: fromList,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
