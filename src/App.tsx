import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import { ThemeProvider } from 'styled-components'
import { antdTheme } from './config/antd.config'
import { AdminGuard } from './components/common/AdminGuard'
import { AuthGuard } from './components/common/AuthGuard'
import { PublicOnlyGuard } from './components/common/PublicOnlyGuard'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { GlobalStyles } from './styles/globalStyles'
import { appTheme } from './styles/theme'
import { Home } from './pages/user/Home'
import { AdminLeaderboard } from './pages/admin/AdminLeaderboard'
import { AuditLog } from './pages/admin/AuditLog'
import { AdminDashboard } from './pages/admin/Dashboard'
import { PromptModeration } from './pages/admin/PromptModeration'
import { RoundManagement } from './pages/admin/RoundManagement'
import { UserManagement } from './pages/admin/UserManagement'
import { Dashboard } from './pages/user/Dashboard'
import { Leaderboard } from './pages/user/Leaderboard'
import { Profile } from './pages/user/Profile'
import { History } from './pages/user/History'
import { Award } from './pages/user/Award'

// Loading fallback component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <Spin size="large" tip="로딩 중..." />
  </div>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <GlobalStyles />
          <ConfigProvider theme={antdTheme}>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes - Redirect to dashboard if logged in */}
                  <Route element={<PublicOnlyGuard />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/award" element={<Award />} />
                  </Route>

                  {/* Protected Routes - Require Authentication */}
                  {/* <Route element={<AuthGuard />}>
                  </Route> */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Admin Routes - Require Admin Role */}
                  <Route element={<AdminGuard />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
                    <Route path="/admin/rounds" element={<RoundManagement />} />
                    <Route path="/admin/prompts" element={<PromptModeration />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/audit" element={<AuditLog />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
