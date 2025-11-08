import { HistoryOutlined, HomeOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import type { FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const { Footer } = Layout

export const BottomNavigation: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/dashboard', icon: <HomeOutlined />, label: '게임' },
    { key: '/leaderboard', icon: <TrophyOutlined />, label: '순위' },
    { key: '/history', icon: <HistoryOutlined />, label: '히스토리' },
    { key: '/profile', icon: <UserOutlined />, label: '프로필' },
  ]

  return (
    <Footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        zIndex: 1000,
      }}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          border: 'none',
        }}
        aria-label="주요 메뉴"
      />
    </Footer>
  )
}
