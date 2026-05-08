import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl mb-3" />
      ))}
    </div>
  )
}
