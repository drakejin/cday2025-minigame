import type { FC, ReactNode } from 'react'
import { Layout } from 'antd'
import { BottomNavigation } from './BottomNavigation'

const { Content } = Layout

interface MainLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          padding: '16px',
          paddingBottom: '80px',
        }}
      >
        {children}
      </Content>

      <BottomNavigation />
    </Layout>
  )
}
