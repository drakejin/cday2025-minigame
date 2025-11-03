import { type FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography, Spin } from 'antd'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/store/authStore'

const { Title } = Typography

export const Login: FC = () => {
  const navigate = useNavigate()
  const { user, initialized, isLoading } = useAuth()

  console.log('[Login] State:', { user: !!user, initialized, isLoading })

  // Redirect to dashboard if already logged in
  useEffect(() => {
    console.log('[Login] useEffect check:', { initialized, user: !!user })
    if (initialized && user) {
      console.log('[Login] User logged in, redirecting to dashboard')
      navigate('/dashboard', { replace: true })
    }
  }, [initialized, user, navigate])

  // Show loading spinner while checking auth state
  if (isLoading) {
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Character Battle</Title>
          <Typography.Text type="secondary">Google 계정으로 간편하게 시작하세요</Typography.Text>
        </div>
        <LoginForm />
      </Card>
    </div>
  )
}
