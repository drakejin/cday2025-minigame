# CLAUDE.md - Project Setup & Development Guide

## Project Overview
캐릭터 육성 이벤트 서비스 - 1시간마다 30자 프롬프트로 최강의 캐릭터 만들기

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions)
- **Styling**: Ant Design + styled-components
- **Linter/Formatter**: Biome.js
- **State Management**: Zustand
- **Router**: React Router v6
- **Form**: Ant Design Form + Zod

---

## Initial Setup

### 1. Prerequisites
```bash
node --version  # v18+ required
yarn --version  # or npm
```

### 2. Project Initialization

#### Step 1: Create Vite Project
```bash
yarn create vite cday2025-minigame --template react-ts
cd cday2025-minigame
```

#### Step 2: Install Dependencies
```bash
# Core dependencies
yarn add react react-dom react-router-dom zustand @supabase/supabase-js

# UI - Ant Design (모든 페이지에서 사용)
yarn add antd @ant-design/icons

# Styling
yarn add styled-components
yarn add -D @types/styled-components

# Form & validation
yarn add zod

# Utils
yarn add dayjs

# Dev dependencies
yarn add -D @biomejs/biome
yarn add -D @types/node
```

#### Step 3: Initialize Configurations
```bash
# Biome.js only
yarn biome init

# ❌ Tailwind 설정 안 함 (사용하지 않음)
```

---

## Configuration Files

### 1. package.json Scripts
Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "format": "biome format --write .",
    "lint": "biome lint --write .",
    "check": "biome check --write .",
    "type-check": "tsc --noEmit",
    "prebuild": "yarn format && yarn lint && yarn type-check"
  }
}
```

### 2. biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", "dist", "build", ".vite", "*.config.js"]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100,
    "attributePosition": "auto"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "trailingCommas": "es5",
      "semicolons": "asNeeded",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteStyle": "single",
      "attributePosition": "auto"
    }
  }
}
```

### 3. tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 5. vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 6. .env.example
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Project Structure

```
cday2025-minigame/
├── docs/
│   ├── DB_DESIGN.md
│   ├── API_SPEC.md
│   └── FRONT.md
├── supabase/
│   ├── migrations/
│   │   └── 20250101000000_initial_schema.sql
│   ├── functions/
│   │   ├── submit-prompt/
│   │   ├── advance-round/
│   │   └── get-my-rank/
│   └── config.toml
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── character/
│   │   ├── leaderboard/
│   │   └── game/
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Auth/
│   │   ├── Game/
│   │   ├── Leaderboard/
│   │   └── Profile/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── config/
│   │   └── antd.config.ts
│   └── styles/
│       ├── theme.ts
│       ├── globalStyles.ts
│       └── antdTheme.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── biome.json
├── .env
└── .env.example
```

---

## Development Workflow

### Before Every Commit
```bash
# Format code
yarn format

# Lint and fix
yarn lint

# Type check
yarn type-check

# Build to ensure no errors
yarn build
```

### Development Server
```bash
yarn dev
```

### Production Build
```bash
yarn build
yarn preview
```

---

## Supabase Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Initialize Supabase Project
```bash
supabase init
```

### 4. Link to Remote Project
```bash
supabase link --project-ref your-project-ref
```

### 5. Create Migration from DB_DESIGN.md
```bash
supabase migration new initial_schema
```

Copy SQL from `docs/DB_DESIGN.md` to migration file.

### 6. Push Database Changes
```bash
supabase db push
```

### 7. Generate TypeScript Types
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Initial Code Setup (Ant Design + styled-components)

### 1. src/styles/theme.ts
```typescript
export const appTheme = {
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '992px',
    wide: '1200px',
  },
}
```

### 2. src/styles/globalStyles.ts
```typescript
import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* 스크롤바 스타일 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
`
```

### 3. src/config/antd.config.ts
```typescript
import type { ThemeConfig } from 'antd'

// 전체 앱 통일 테마
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    borderRadius: 8,
    fontSize: 14,
  },
}

// User Pages는 다른 primary color 사용 (선택사항)
export const userAntdTheme: ThemeConfig = {
  ...antdTheme,
  token: {
    ...antdTheme.token,
    colorPrimary: '#7c3aed', // Purple for game feeling
  },
}

// Admin Pages는 기본 테마 사용
export const adminAntdTheme = antdTheme
```

### 4. src/config/env.ts
```typescript
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
} as const

// Validation
if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error('Missing required environment variables')
}
```

### 5. src/services/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
```

### 6. src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 7. src/App.tsx
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from './styles/globalStyles'
import { appTheme } from './styles/theme'
import { antdTheme } from './config/antd.config'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AuthGuard } from './components/common/AuthGuard'
import { Landing } from './pages/user/Landing'
import { Login } from './pages/user/Login'
import { Dashboard } from './pages/user/Dashboard'
import { Leaderboard } from './pages/user/Leaderboard'
import { History } from './pages/user/History'
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
    </ErrorBoundary>
  )
}

export default App
```

### 8. src/styled.d.ts (TypeScript 타입 정의)
```typescript
import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    spacing: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      xxl: string
    }
    breakpoints: {
      mobile: string
      tablet: string
      desktop: string
      wide: string
    }
  }
}
```

---

## Git Hooks (Optional)

### Install husky
```bash
yarn add -D husky lint-staged
npx husky init
```

### .husky/pre-commit
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

yarn format
yarn lint
yarn type-check
```

### package.json
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome format --write",
      "biome lint --write"
    ]
  }
}
```

---

## Development Guidelines

### 1. Code Style
- Use Biome.js for formatting and linting
- Follow TypeScript strict mode
- Use functional components with hooks
- **Use default exports for components** (prefer default export over named export)

### 2. Component Structure (Ant Design 기본 우선)
```typescript
// ComponentName.tsx
import { type FC } from 'react'
import { Card, Space, Typography } from 'antd'

interface ComponentNameProps {
  title: string
  // other props
}

const ComponentName: FC<ComponentNameProps> = ({ title }) => {
  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Typography.Text>Content here</Typography.Text>
      </Space>
    </Card>
  )
}

export default ComponentName
```

**원칙:**
- ✅ Ant Design 기본 컴포넌트 사용
- ✅ `style` prop으로 간단한 스타일 적용
- ✅ **Default export 사용 (named export 대신)**
- ❌ 불필요한 styled-components 제거

### 3. Custom Hook Structure
```typescript
// useHookName.ts
import { useState, useEffect } from 'react'

export const useHookName = (param: string) => {
  const [state, setState] = useState<Type>(initialValue)

  useEffect(() => {
    // logic
  }, [param])

  return { state, setState }
}
```

### 4. Service Structure
```typescript
// service.ts
import { supabase } from './supabase'
import type { ServiceType } from '@/types'

export const serviceName = {
  async fetchData(): Promise<ServiceType[]> {
    const { data, error } = await supabase
      .from('table')
      .select('*')

    if (error) throw error
    return data
  },
}
```

---

## Deployment

### Build for Production
```bash
yarn build
```

### Deploy to Vercel/Netlify
1. Connect GitHub repository
2. Set environment variables
3. Build command: `yarn build`
4. Output directory: `dist`

---

## Troubleshooting

### Issue: Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

### Issue: Biome errors
```bash
# Fix all auto-fixable issues
yarn check

# Or manually fix
yarn format
yarn lint
```

### Issue: Type errors
```bash
# Regenerate Supabase types
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Next Steps

1. ✅ Complete initial setup
2. ⬜ Set up Supabase project and database
3. ⬜ Implement authentication flow
4. ⬜ Create base components (Button, Input, Card, etc.)
5. ⬜ Build layout components (Header, Footer, Navigation)
6. ⬜ Implement routing structure
7. ⬜ Create state management stores
8. ⬜ Build core pages (Dashboard, Leaderboard, etc.)
9. ⬜ Implement real-time features
10. ⬜ Add animations and polish
11. ⬜ Testing and optimization
12. ⬜ Deploy to production

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Biome.js Documentation](https://biomejs.dev/)
- [Radix UI Documentation](https://www.radix-ui.com/)
