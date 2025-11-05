import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AuditOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useAuthStore } from '@/store/authStore'

const { Header, Sider, Content } = Layout
const { Title } = Typography

interface AdminLayoutProps {
  children: ReactNode
}

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '대시보드',
    },
    {
      key: '/admin/leaderboard',
      icon: <TrophyOutlined />,
      label: '순위',
    },
    {
      key: '/admin/rounds',
      icon: <ClockCircleOutlined />,
      label: '라운드 관리',
    },
    {
      key: '/admin/prompts',
      icon: <FileSearchOutlined />,
      label: '프롬프트 관리',
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: '사용자 관리',
    },
    {
      key: '/admin/statistics',
      icon: <BarChartOutlined />,
      label: '통계 분석',
    },
    {
      key: '/admin/audit',
      icon: <AuditOutlined />,
      label: '활동 로그',
    },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '사용자 대시보드',
      onClick: () => navigate('/dashboard'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
        trigger={null}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {!collapsed && <Title level={4}>Admin Panel</Title>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: '#001529',
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
          </Space>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.email}
            </Button>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
