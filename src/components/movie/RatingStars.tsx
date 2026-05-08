'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value?: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  max?: number
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export function RatingStars({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  max = 10,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState(0)

  const displayValue = hovered > 0 ? hovered : value

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }).map((_, i) => {
        const star = i + 1
        const filled = star <= displayValue

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} из ${max}`}
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              'transition-colors duration-100',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              filled ? 'text-amber-400' : 'text-zinc-600'
            )}
          >
            <Star
              className={cn(sizes[size], filled && 'fill-amber-400')}
            />
          </button>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-amber-400">{value}</span>
      )}
    </div>
  )
}
