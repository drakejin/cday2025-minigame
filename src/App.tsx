import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ThemeProvider } from 'styled-components'
import { antdTheme } from './config/antd.config'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AuthGuard } from './components/common/AuthGuard'
import { GlobalStyles } from './styles/globalStyles'
import { appTheme } from './styles/theme'
import { Dashboard } from './pages/user/Dashboard'
import { History } from './pages/user/History'
import { Landing } from './pages/user/Landing'
import { Leaderboard } from './pages/user/Leaderboard'
import { Login } from './pages/user/Login'
import { Profile } from './pages/user/Profile'
import './store/authStore'

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
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
