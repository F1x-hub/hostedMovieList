import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './index'
import type { UserDoc } from '@/types'

export async function getUser(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as UserDoc) : null
}

export async function createOrUpdateUser(
  uid: string,
  data: Partial<UserDoc>
): Promise<void> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      userId: uid,
      displayName: data.displayName ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      username: data.username ?? '',
      usernameLower: (data.username ?? '').toLowerCase(),
      photoURL: data.photoURL ?? '',
      photoPath: data.photoPath ?? '',
      email: data.email ?? '',
      stats: { totalRatings: 0, averageRating: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(
      ref,
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }
}

export async function updateUserStats(
  uid: string,
  totalRatings: number,
  averageRating: number
): Promise<void> {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    'stats.totalRatings': totalRatings,
    'stats.averageRating': averageRating,
    updatedAt: serverTimestamp(),
  })
}
