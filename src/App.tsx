import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import { ThemeProvider } from 'styled-components'
import { antdTheme } from './config/antd.config'
import { AdminGuard } from './components/common/AdminGuard'
import { AuthGuard } from './components/common/AuthGuard'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { GlobalStyles } from './styles/globalStyles'
import { appTheme } from './styles/theme'
import { Landing } from './pages/user/Landing'
import { Login } from './pages/user/Login'
import { AuditLog } from './pages/admin/AuditLog'
import { AdminDashboard } from './pages/admin/Dashboard'
import { PromptModeration } from './pages/admin/PromptModeration'
import { RoundManagement } from './pages/admin/RoundManagement'
import { Statistics } from './pages/admin/Statistics'
import { UserManagement } from './pages/admin/UserManagement'
import { Dashboard } from './pages/user/Dashboard'
import { Leaderboard } from './pages/user/Leaderboard'
import { Profile } from './pages/user/Profile'
import { History } from './pages/user/History'

// // Lazy load all pages for code splitting
// const Landing = lazy(() =>
//   import('./pages/user/Landing').then((module) => ({ default: module.Landing }))
// )
// const Login = lazy(() => import('./pages/user/Login').then((module) => ({ default: module.Login })))
// const Dashboard = lazy(() =>
//   import('./pages/user/Dashboard').then((module) => ({ default: module.Dashboard }))
// )
// const History = lazy(() =>
//   import('./pages/user/History').then((module) => ({ default: module.History }))
// )
// const Leaderboard = lazy(() =>
//   import('./pages/user/Leaderboard').then((module) => ({ default: module.Leaderboard }))
// )
// const Profile = lazy(() =>
//   import('./pages/user/Profile').then((module) => ({ default: module.Profile }))
// )
// const AdminDashboard = lazy(() =>
//   import('./pages/admin/Dashboard').then((module) => ({ default: module.AdminDashboard }))
// )
// const RoundManagement = lazy(() =>
//   import('./pages/admin/RoundManagement').then((module) => ({ default: module.RoundManagement }))
// )
// const PromptModeration = lazy(() =>
//   import('./pages/admin/PromptModeration').then((module) => ({
//     default: module.PromptModeration,
//   }))
// )
// const UserManagement = lazy(() =>
//   import('./pages/admin/UserManagement').then((module) => ({ default: module.UserManagement }))
// )
// const Statistics = lazy(() =>
//   import('./pages/admin/Statistics').then((module) => ({ default: module.Statistics }))
// )
// const AuditLog = lazy(() =>
//   import('./pages/admin/AuditLog').then((module) => ({ default: module.AuditLog }))
// )

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
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes - Require Authentication */}
                  <Route element={<AuthGuard />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>

                  {/* Admin Routes - Require Admin Role */}
                  <Route element={<AdminGuard />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/rounds" element={<RoundManagement />} />
                    <Route path="/admin/prompts" element={<PromptModeration />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/statistics" element={<Statistics />} />
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
