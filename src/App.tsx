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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={appTheme}>
        <GlobalStyles />
        <ConfigProvider theme={antdTheme}>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              {/* <Route element={<AuthGuard />}>
              </Route> */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />

            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
