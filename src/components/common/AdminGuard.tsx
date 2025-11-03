import type { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Alert, Card, Space, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useAuth } from '@/store/authStore'
import { Loading } from './Loading'

const { Title, Text } = Typography

/**
 * Admin Route Guard
 * Checks if user is authenticated and has admin role from DB profile
 */
export const AdminGuard: FC = () => {
  const { user, profile, initialized } = useAuth()

  console.log('[AdminGuard]', {
    user: !!user,
    profile: !!profile,
    initialized,
    role: profile?.role,
  })

  // Wait for auth initialization
  if (!initialized) {
    console.log('[AdminGuard] Waiting for initialization...')
    return <Loading fullscreen tip="권한 확인 중..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[AdminGuard] No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Wait for profile to load
  if (!profile) {
    console.log('[AdminGuard] No profile yet, showing loading...')
    return <Loading fullscreen tip="프로필 로딩 중..." />
  }

  // Check if user is admin from DB profile
  const isAdmin = profile.role === 'admin'
  console.log('[AdminGuard] Role check:', { role: profile.role, isAdmin })

  if (!isAdmin) {
    console.log('[AdminGuard] Access denied - not an admin')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <Card style={{ maxWidth: 500, width: '100%' }}>
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
            <div>
              <Title level={3}>접근 권한 없음</Title>
              <Text type="secondary">Admin 권한이 필요한 페이지입니다.</Text>
            </div>
            <Alert
              message="관리자 권한 필요"
              description="이 페이지에 접근하려면 관리자 권한이 필요합니다. 권한이 필요한 경우 시스템 관리자에게 문의하세요."
              type="error"
              showIcon
            />
          </Space>
        </Card>
      </div>
    )
  }

  console.log('[AdminGuard] Access granted - rendering admin route')
  return <Outlet />
}
