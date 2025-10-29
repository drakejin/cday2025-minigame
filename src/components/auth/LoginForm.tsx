import type { FC } from 'react'
import { Button, Space, Divider, message } from 'antd'
import { GoogleOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'

export const LoginForm: FC = () => {
  const { signInWithGoogle, isLoading } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...')
      const result = await signInWithGoogle()
      console.log('Google login result:', result)
    } catch (error) {
      console.error('Google login error:', error)
      message.error('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Divider>간편 로그인</Divider>

      <Button
        type="primary"
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        loading={isLoading}
        block
        size="large"
      >
        Google로 시작하기
      </Button>
    </Space>
  )
}
