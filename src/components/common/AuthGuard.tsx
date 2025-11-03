import type { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { Loading } from './Loading'

export const AuthGuard: FC = () => {
  const { user, initialized } = useAuth()

  console.log('[AuthGuard]', { user: !!user, initialized })

  // Wait for auth initialization to complete
  // Don't check isLoading - it's for manual actions like signIn/signOut
  if (!initialized) {
    console.log('[AuthGuard] Waiting for initialization...')
    return <Loading fullscreen tip="인증 확인 중..." />
  }

  // After initialization, redirect if no user
  if (!user) {
    console.log('[AuthGuard] No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('[AuthGuard] User authenticated, rendering protected route')
  return <Outlet />
}
