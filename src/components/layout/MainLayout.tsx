import { Layout } from 'antd'
import type { FC, ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

const { Content } = Layout

interface MainLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  withoutPadding?: boolean
}

export const MainLayout: FC<MainLayoutProps> = ({
  children,
  showBottomNav = true,
  withoutPadding = false,
}) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          padding: withoutPadding ? '0' : '16px',
          paddingBottom: withoutPadding ? '0' : '80px',
        }}
      >
        {children}
      </Content>

      {showBottomNav && <BottomNavigation />}
    </Layout>
  )
}
