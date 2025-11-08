import { GoogleOutlined } from '@ant-design/icons'
import { Button, Modal, message, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useAuthStore } from '@/store/authStore'

const { Title, Paragraph } = Typography

interface GoogleLoginModalProps {
  open: boolean
  onCancel: () => void
}

export const GoogleLoginModal: FC<GoogleLoginModalProps> = ({ open, onCancel }) => {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const isLoading = useAuthStore((state) => state.isLoading)

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login from modal...')
      await signInWithGoogle()
      onCancel()
    } catch (error) {
      console.error('Google login error:', error)
      message.error('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
      styles={{
        body: {
          padding: '40px 24px',
          background: '#ffffff',
        },
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>
            로그인
          </Title>
          <Paragraph type="secondary">게임에 참여하려면 로그인이 필요합니다</Paragraph>
        </div>

        <Button
          type="default"
          icon={<GoogleOutlined style={{ fontSize: 20, color: '#4285F4' }} />}
          onClick={handleGoogleLogin}
          loading={isLoading}
          size="large"
          block
          style={{
            height: 56,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            border: '1px solid #dadce0',
            borderRadius: 4,
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            fontWeight: 500,
            color: '#3c4043',
          }}
        >
          Google 계정으로 계속하기
        </Button>

        <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
          로그인하면 서비스 약관 및 개인정보 보호정책에 동의하게 됩니다
        </Paragraph>
      </Space>
    </Modal>
  )
}
