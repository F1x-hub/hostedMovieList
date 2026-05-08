'use client'

import { useState } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Этот email уже используется',
  'auth/invalid-email': 'Неверный формат email',
  'auth/weak-password': 'Пароль должен быть не менее 6 символов',
  'auth/user-not-found': 'Пользователь не найден',
  'auth/wrong-password': 'Неверный пароль',
  'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
  'auth/popup-closed-by-user': 'Окно входа было закрыто',
}

function getAuthError(err: AuthError): string {
  return AUTH_ERRORS[err.code] ?? err.message
}

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      setError(getAuthError(err as AuthError))
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(getAuthError(err as AuthError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      {/* Mode toggle */}
      <div className="flex rounded-xl bg-zinc-800 p-1">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null) }}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              mode === m
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {m === 'login' ? 'Войти' : 'Регистрация'}
          </button>
        ))}
      </div>

      {/* Google */}
      <Button
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        loading={loading}
        className="w-full"
        id="google-sign-in"
      >
        <LogIn className="w-5 h-5" />
        Войти через Google
      </Button>

      <div className="flex items-center gap-3">
        <hr className="flex-1 border-zinc-800" />
        <span className="text-xs text-zinc-500">или</span>
        <hr className="flex-1 border-zinc-800" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
        <Input
          id="auth-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />
        <Input
          id="auth-password"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={6}
        />

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full mt-1"
          id="email-auth-submit"
        >
          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </Button>
      </form>
    </div>
  )
}
