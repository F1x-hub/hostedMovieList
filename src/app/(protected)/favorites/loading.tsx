import { MovieGridSkeleton } from '@/components/ui/Skeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <MovieGridSkeleton />
    </div>
  )
}
