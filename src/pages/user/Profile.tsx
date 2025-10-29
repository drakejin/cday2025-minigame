import type { FC } from 'react'
import { Card, Descriptions, Avatar, Space, Button } from 'antd'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/authStore'
import { useMyCharacter } from '@/hooks/queries/useCharacterQuery'

export const Profile: FC = () => {
  const user = useAuthStore((state) => state.user)
  const { data: character } = useMyCharacter()

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* User Profile */}
        <Card
          title="내 프로필"
          extra={
            <Button icon={<EditOutlined />} type="link">
              수정
            </Button>
          }
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={80} src={user?.user_metadata?.avatar_url} icon={<UserOutlined />} />
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="닉네임">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </Descriptions.Item>
              <Descriptions.Item label="이메일">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="가입일">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>

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
      </Space>
    </MainLayout>
  )
}
