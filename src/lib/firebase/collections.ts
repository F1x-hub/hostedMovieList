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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './index'
import type { CollectionDoc } from '@/types'

export async function getUserCollections(
  userId: string
): Promise<(CollectionDoc & { _id: string })[]> {
  const q = query(
    collection(db, 'users', userId, 'collections'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    ...d.data(),
    _id: d.id,
  })) as (CollectionDoc & { _id: string })[]
}

export async function createCollection(
  userId: string,
  data: Pick<CollectionDoc, 'title' | 'description' | 'coverUrl' | 'isPublic'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'collections'), {
    ...data,
    movies: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Store the auto-id back into the document
  await updateDoc(ref, { id: ref.id })
  return ref.id
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: Partial<Pick<CollectionDoc, 'title' | 'description' | 'coverUrl' | 'isPublic'>>
): Promise<void> {
  const ref = doc(db, 'users', userId, 'collections', collectionId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'collections', collectionId))
}

export async function addMovieToCollection(
  userId: string,
  collectionId: string,
  movieId: number | string
): Promise<void> {
  const ref = doc(db, 'users', userId, 'collections', collectionId)
  await updateDoc(ref, {
    movies: arrayUnion(movieId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeMovieFromCollection(
  userId: string,
  collectionId: string,
  movieId: number | string
): Promise<void> {
  const ref = doc(db, 'users', userId, 'collections', collectionId)
  await updateDoc(ref, {
    movies: arrayRemove(movieId),
    updatedAt: serverTimestamp(),
  })
}

export async function getPublicCollections(): Promise<(CollectionDoc & { _id: string; userId: string })[]> {
  const allUsersSnap = await getDocs(collection(db, 'users'))
  const results: (CollectionDoc & { _id: string; userId: string })[] = []

  for (const userDoc of allUsersSnap.docs) {
    const q = query(
      collection(db, 'users', userDoc.id, 'collections'),
      where('isPublic', '==', true)
    )
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      results.push({ ...d.data(), _id: d.id, userId: userDoc.id } as CollectionDoc & {
        _id: string
        userId: string
      })
    }
  }

  return results
}
