import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppstoreOutlined,
  AuditOutlined,
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
import { Avatar, Button, Dropdown, Layout, Menu, Space, Tag, Typography } from 'antd'
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
  const { user, profile, signOut } = useAuthStore()
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
      key: 'service',
      icon: <AppstoreOutlined />,
      label: '서비스 페이지',
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'super_admin':
        return 'Super Admin'
      default:
        return 'User'
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'red'
      case 'admin':
        return 'blue'
      default:
        return 'default'
    }
  }

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
          {!collapsed && (
            <Title style={{ color: 'white' }} level={4}>
              Admin Panel
            </Title>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          // style={{
          //   background: '#001529',
          // }}
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

          <Space size="middle">
            <Button
              type="default"
              icon={<AppstoreOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              서비스 페이지
            </Button>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" style={{ height: 'auto', padding: '4px 12px' }}>
                <Space>
                  <Avatar
                    size="small"
                    src={profile?.avatarUrl}
                    icon={!profile?.avatarUrl && <UserOutlined />}
                  />
                  <Space direction="vertical" size={0} style={{ alignItems: 'flex-start' }}>
                    <Space size={4}>
                      <span style={{ fontWeight: 500 }}>
                        {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <Tag color={getRoleColor(profile?.role)} style={{ margin: 0 }}>
                        {getRoleLabel(profile?.role)}
                      </Tag>
                    </Space>
                    <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{user?.email}</span>
                  </Space>
                </Space>
              </Button>
            </Dropdown>
          </Space>
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
