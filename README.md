# Character Battle - 최강의 캐릭터 만들기 🎮

1시간마다 30자 프롬프트로 캐릭터를 성장시키는 이벤트 서비스

## ✨ Features

- 🔐 **Google OAuth 로그인** - 간편한 소셜 로그인
- 🎯 **프롬프트 기반 성장** - 30자 프롬프트로 캐릭터 육성
- 📊 **실시간 리더보드** - Supabase Realtime으로 실시간 업데이트
- ⏱️ **라운드 시스템** - 1시간 단위 라운드 진행
- 👨‍💼 **Admin Panel** - 라운드/사용자/프롬프트 관리
- 📱 **모바일 최적화** - 반응형 디자인

## 🛠️ Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions)
- **UI Library**: Ant Design + styled-components
- **Data Fetching**: React Query (@tanstack/react-query)
- **State Management**: Zustand (Auth only)
- **Router**: React Router v6
- **Linter/Formatter**: Biome.js
- **Form Validation**: Zod (선택적 사용)

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
yarn dev
```

### 4. Build for Production

```bash
yarn build
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production (includes format, lint, and type-check)
- `yarn preview` - Preview production build
- `yarn format` - Format code with Biome
- `yarn lint` - Lint and fix code with Biome
- `yarn check` - Run all Biome checks (format + lint)
- `yarn type-check` - Type check with TypeScript

## 📁 Project Structure

```
src/
├── App.tsx                    # Main app with lazy loading
├── main.tsx                   # Entry point
├── components/
│   ├── auth/                  # Authentication components
│   ├── character/             # Character-related components
│   ├── common/                # Shared components (AuthGuard, AdminGuard, etc.)
│   ├── game/                  # Game components (RoundTimer, etc.)
│   ├── layout/                # Layout components (Header, Navigation, etc.)
│   └── leaderboard/           # Leaderboard components
├── pages/
│   ├── user/                  # User pages (Dashboard, Leaderboard, etc.)
│   └── admin/                 # Admin pages (5 pages)
├── hooks/
│   └── queries/               # React Query hooks
├── services/                  # API service layer (Edge Functions only)
├── store/                     # Zustand stores (authStore only)
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
├── config/                    # App configuration
└── styles/                    # Global styles & theme

supabase/
├── functions/                 # 33 Edge Functions
│   ├── _shared/              # Shared utilities (auth, db, cors, etc.)
│   ├── submit-prompt/        # User functions (11개)
│   └── admin-*/              # Admin functions (16개)
└── migrations/               # Database migrations
```

## 🏗️ Architecture

### 100% Edge Functions Architecture
- ✅ **모든 쓰기 작업**: Edge Functions를 통해서만 수행
- ✅ **읽기 작업**: 일부는 Client SDK 직접 접근 (리더보드 등)
- ✅ **Admin 시스템**: Edge Functions로 라운드 수동 관리
- ✅ **Real-time**: Supabase Realtime Subscriptions
- ✅ **Rate Limiting**: Deno KV 사용

### Performance Optimizations
- ⚡ **Code Splitting**: React.lazy로 모든 페이지 분리
- ⚡ **Manual Chunking**: Vendor 라이브러리 별도 chunk
- ⚡ **Component Memoization**: React.memo 적용
- ⚡ **Bundle Size**: 각 페이지 0.6~6 kB (gzipped)

### Accessibility
- ♿ **ARIA Labels**: 모든 주요 컴포넌트
- ♿ **Semantic HTML**: Proper role attributes
- ♿ **Keyboard Navigation**: Ant Design 기본 지원
- ♿ **Screen Reader**: 완전 지원

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete Setup & Development Guide
- [TODOLIST.md](./TODOLIST.md) - Project Progress Tracker
- [docs/DB_DESIGN.md](./docs/DB_DESIGN.md) - Database Schema
- [docs/API_SPEC.md](./docs/API_SPEC.md) - API Specification
- [docs/FRONT.md](./docs/FRONT.md) - Frontend Structure

## 🚀 Deployment

**Quick Deploy:**
```bash
# Setup .env first
cp .env.example .env

# One command to deploy everything
./deploy.sh
```

See [DEPLOY.md](./DEPLOY.md) for quick guide or [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 📊 Project Status

- ✅ Phase 1-18: Core features complete
- ✅ Phase 19: Performance & accessibility complete
- 🔄 Phase 20: Documentation (in progress)
- ⏳ Phase 21: Deployment (ready)

## 📝 License

MIT
