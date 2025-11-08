import { CalendarOutlined, InfoCircleOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Space, Typography } from 'antd'
import { type FC, useState } from 'react'
import { GameRuleModal } from '@/components/common/GameRuleModal'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/authStore'

const { Title, Text } = Typography

export const Profile: FC = () => {
  const user = useAuthStore((state) => state.user)
  const [showGameRuleModal, setShowGameRuleModal] = useState(false)

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          프로필
        </Title>
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => setShowGameRuleModal(true)}
          style={{ fontSize: 20 }}
        >
          게임가이드
        </Button>
      </div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* User Profile */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '16px',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>
                  내 프로필
                </Title>
              </Space>
            </div>

            {/* Avatar */}
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Avatar
                size={80}
                src={user?.user_metadata?.avatar_url}
                icon={<UserOutlined />}
                style={{ border: '3px solid #e0e0e0' }}
              />
            </div>

            {/* User Info */}
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      닉네임
                    </Text>
                  </div>
                  <Text strong style={{ fontSize: 14, paddingLeft: 24 }}>
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </Text>
                </Space>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MailOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      이메일
                    </Text>
                  </div>
                  <Text style={{ fontSize: 14, paddingLeft: 24 }}>{user?.email}</Text>
                </Space>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      가입일
                    </Text>
                  </div>
                  <Text style={{ fontSize: 14, paddingLeft: 24 }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                  </Text>
                </Space>
              </div>
            </Space>
          </Space>
        </div>
      </Space>
      <GameRuleModal open={showGameRuleModal} onClose={() => setShowGameRuleModal(false)} />
    </MainLayout>
  )
}
