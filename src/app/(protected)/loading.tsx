import { MovieGridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="animate-pulse h-40 rounded-2xl bg-zinc-800 mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-zinc-800" />
        ))}
      </div>
      <MovieGridSkeleton count={6} />
    </div>
  )
}
