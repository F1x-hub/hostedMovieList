'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthForm } from '@/components/auth/AuthForm'
import { Film } from 'lucide-react'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-950 via-zinc-900 to-zinc-950 p-12 border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8 text-violet-400" />
          <span className="text-2xl font-bold text-zinc-100">CineList</span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-zinc-100 leading-tight">
            Ваш личный<br />
            <span className="text-violet-400">кинотрекер</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Оценивайте фильмы, ведите список просмотренного, создавайте коллекции и делитесь ими.
          </p>
        </div>

        <div className="flex items-center gap-8 text-sm text-zinc-500">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-zinc-200">10К+</span>
            <span>фильмов</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-zinc-200">∞</span>
            <span>коллекций</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-zinc-200">1</span>
            <span>аккаунт</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <Film className="w-7 h-7 text-violet-400" />
          <span className="text-xl font-bold text-zinc-100">CineList</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Добро пожаловать</h2>
          <p className="text-zinc-400 text-sm mb-8">Войдите, чтобы продолжить</p>
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
