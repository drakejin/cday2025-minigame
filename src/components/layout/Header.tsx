import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Layout, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const { Header: AntHeader } = Layout
const { Title } = Typography

export const Header: FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <AntHeader
      style={{
        background: '#001529',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      role="banner"
    >
      <Title level={4} style={{ color: 'white', margin: 0 }} aria-label="사이트 로고">
        Character Battle
      </Title>

      {user && (
        <Space role="navigation" aria-label="사용자 메뉴">
          <Button
            type="text"
            icon={<UserOutlined />}
            onClick={() => navigate('/profile')}
            style={{ color: 'white' }}
            aria-label={`프로필 - ${user.email}`}
          >
            {user.email}
          </Button>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: 'white' }}
            aria-label="로그아웃"
          >
            로그아웃
          </Button>
        </Space>
      )}
    </AntHeader>
  )
}
