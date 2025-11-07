import type { FC } from 'react'
import { Avatar, Space, Typography, Card, Descriptions } from 'antd'
import { UserOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons'
import { MainLayout } from '@/components/layout/MainLayout'
import { PlanEditor } from '@/components/character/PlanEditor'
import { useAuthStore } from '@/store/authStore'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'

const { Title, Text } = Typography

export const Profile: FC = () => {
  const user = useAuthStore((state) => state.user)
  const { data: character } = useMyCharacter()

  return (
    <MainLayout>
      <Title level={2}>프로필</Title>
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

        {/* Character Info */}
        {character && (
          <Card title="내 캐릭터">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="캐릭터 이름">{character.name}</Descriptions.Item>
              <Descriptions.Item label="현재 프롬프트">
                "{character.current_prompt}"
              </Descriptions.Item>
              <Descriptions.Item label="총점">{character.total_score}</Descriptions.Item>
              <Descriptions.Item label="힘">{character.strength}</Descriptions.Item>
              <Descriptions.Item label="매력">{character.charm}</Descriptions.Item>
              <Descriptions.Item label="창의성">{character.creativity}</Descriptions.Item>
              <Descriptions.Item label="생성일">
                {new Date(character.created_at).toLocaleDateString('ko-KR')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Character Plan Editor */}
        <PlanEditor />
      </Space>
    </MainLayout>
  )
}
