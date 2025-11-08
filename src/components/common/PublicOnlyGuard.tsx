import { Spin } from 'antd'
import type { FC } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/**
 * PublicOnlyGuard - Redirects authenticated users to dashboard
 * Used for routes that should only be accessible to non-authenticated users (Landing, Login)
 */
export const PublicOnlyGuard: FC = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)

  if (location.pathname === '/award') {
    return <Outlet />
  }

  // Wait for auth to initialize
  if (!initialized) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip="인증 확인 중..." />
      </div>
    )
  }
  // Redirect to dashboard if user is logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // Render the public route
  return <Outlet />
}
