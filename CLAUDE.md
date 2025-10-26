# CLAUDE.md - Project Setup & Development Guide

## Project Overview
캐릭터 육성 이벤트 서비스 - 1시간마다 30자 프롬프트로 최강의 캐릭터 만들기

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Linter/Formatter**: Biome.js
- **State Management**: Zustand
- **Router**: React Router v6
- **Form**: React Hook Form + Zod
- **Animation**: Framer Motion

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
yarn add react-router-dom zustand @supabase/supabase-js

# UI libraries
yarn add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-avatar @radix-ui/react-progress
yarn add class-variance-authority clsx tailwind-merge lucide-react

# Form & validation
yarn add react-hook-form @hookform/resolvers zod

# Animation
yarn add framer-motion

# Utils
yarn add date-fns

# Dev dependencies
yarn add -D tailwindcss postcss autoprefixer
yarn add -D @biomejs/biome
yarn add -D @types/node
```

#### Step 3: Initialize Configurations
```bash
# Tailwind CSS
yarn tailwindcss init -p

# Biome.js
yarn biome init
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

### 6. tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 7. postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 8. .env.example
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
│   ├── lib/
│   │   └── utils.ts
│   ├── config/
│   └── styles/
│       └── globals.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
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

## shadcn/ui Setup

### 1. Install shadcn/ui
```bash
npx shadcn-ui@latest init
```

Select:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: tailwind.config.js
- Components: src/components
- Utils: src/lib/utils.ts
- React Server Components: No

### 2. Add Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add form
```

---

## Initial Code Setup

### 1. src/styles/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 2. src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. src/services/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

### 4. src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 5. src/App.tsx
```typescript
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <h1 className="text-4xl font-bold text-center py-8">
          Character Battle
        </h1>
      </div>
    </BrowserRouter>
  )
}

export default App
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
- Prefer named exports over default exports

### 2. Component Structure
```typescript
// ComponentName.tsx
import { type FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  className?: string
  // other props
}

export const ComponentName: FC<ComponentNameProps> = ({ className, ...props }) => {
  return (
    <div className={cn('base-classes', className)}>
      {/* content */}
    </div>
  )
}
```

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
