import { GoogleOutlined } from '@ant-design/icons'
import { Button, Divider, message, Space } from 'antd'
import type { FC } from 'react'
import { useAuthStore } from '@/store/authStore'

export const LoginForm: FC = () => {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const isLoading = useAuthStore((state) => state.isLoading)

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
    <Space
      direction="vertical"
      size="large"
      style={{ width: '100%' }}
      role="form"
      aria-label="로그인 폼"
    >
      <Divider>간편 로그인</Divider>

      <Button
        type="primary"
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        loading={isLoading}
        block
        size="large"
        aria-label="Google 계정으로 로그인"
      >
        Google로 시작하기
      </Button>
    </Space>
  )
}
