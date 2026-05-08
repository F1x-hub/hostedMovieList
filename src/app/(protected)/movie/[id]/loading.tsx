import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <Skeleton className="w-full md:w-52 aspect-[2/3] shrink-0 rounded-2xl" />
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-3">
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-16 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <Skeleton className="h-40 w-full rounded-2xl mb-6" />
      <Skeleton className="h-6 w-36 mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl mb-3" />
      ))}
    </div>
  )
}
