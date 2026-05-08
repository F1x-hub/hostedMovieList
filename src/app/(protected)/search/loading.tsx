import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-12 w-full max-w-xl mb-8" />
      <MovieGridSkeleton />
    </div>
  )
}
