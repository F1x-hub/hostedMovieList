'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useFirestoreCollection<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<(T & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!collectionPath) return

    const segments = collectionPath.split('/')
    const col = collection(db, segments[0], ...segments.slice(1))
    const q = query(col, ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map((d) => ({ ...d.data(), _id: d.id } as T & { _id: string }))
        )
        setLoading(false)
      },
      (err) => {
        console.error('[useFirestoreCollection]', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath])

  return { data, loading, error }
}

export { where, orderBy }
