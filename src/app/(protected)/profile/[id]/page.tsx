'use client'

import { useEffect, useState } from 'react'
import { getUser } from '@/lib/firebase/users'
import { getUserRatings } from '@/lib/firebase/ratings'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton, ProfileSkeleton } from '@/components/ui/Skeleton'
import { Star, Film, User } from 'lucide-react'
import Link from 'next/link'
import type { UserDoc, RatingDoc } from '@/types'

type Props = { params: Promise<{ id: string }> }

export default function ProfilePage({ params }: Props) {
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [ratings, setRatings] = useState<RatingDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(async ({ id }) => {
      const [profileData, ratingsData] = await Promise.all([
        getUser(id),
        getUserRatings(id),
      ])
      setProfile(profileData)
      setRatings(ratingsData)
      setLoading(false)
    })
  }, [params])

  const isOwnProfile = currentUser?.uid === profile?.userId

  if (loading) return <ProfileSkeleton />

  if (!profile) {
    return (
      <div className="p-6 text-center text-zinc-500">
        Профиль не найден
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8">
        {profile.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="w-24 h-24 rounded-full object-cover border-2 border-violet-600"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-zinc-100">{profile.displayName}</h1>
          {profile.username && (
            <p className="text-zinc-400 text-sm mt-0.5">@{profile.username}</p>
          )}

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-6 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-100">{profile.stats?.totalRatings ?? 0}</span>
              <span className="text-xs text-zinc-500">оценок</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-amber-400">
                {profile.stats?.averageRating ? profile.stats.averageRating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-zinc-500">средний балл</span>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="shrink-0">
            <span className="px-3 py-1 rounded-full text-xs bg-violet-600/20 text-violet-400 border border-violet-600/30">
              Мой профиль
            </span>
          </div>
        )}
      </div>

      {/* Recent ratings */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Последние оценки
        </h2>

        {ratings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-zinc-500">
            <Film className="w-10 h-10 opacity-30" />
            <p className="text-sm">Нет оценок</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ratings.slice(0, 10).map((r) => (
              <Link
                key={(r as RatingDoc & { _id: string })._id}
                href={`/movie/${r.movieId}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:-translate-y-0.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">Фильм #{r.movieId}</p>
                  {r.comment && <p className="text-xs text-zinc-500 truncate mt-0.5">{r.comment}</p>}
                </div>
                <span className="shrink-0 flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {r.rating}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
