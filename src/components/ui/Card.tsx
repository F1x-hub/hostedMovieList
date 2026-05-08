import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hover?: boolean
  children: ReactNode
}

export function Card({ className, glass, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800',
        glass
          ? 'bg-zinc-900/60 backdrop-blur-md'
          : 'bg-zinc-900',
        hover &&
          'transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
