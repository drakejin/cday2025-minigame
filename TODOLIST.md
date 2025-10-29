# Project Setup & Development TODO List

## Phase 1: Initial Setup ✅

- [x] Create project configuration files
  - [x] package.json
  - [x] biome.json
  - [x] vite.config.ts
  - [x] tsconfig.json / tsconfig.node.json
  - [x] tailwind.config.js / postcss.config.js
  - [x] .env.example
  - [x] .gitignore

- [x] Create project directory structure
  - [x] src/components (common, layout, auth, character, leaderboard, game)
  - [x] src/pages (Auth, Game, Leaderboard, Profile)
  - [x] src/hooks
  - [x] src/store
  - [x] src/services
  - [x] src/types
  - [x] src/utils
  - [x] src/lib
  - [x] src/config
  - [x] src/styles

- [x] Create initial code files
  - [x] src/main.tsx
  - [x] src/App.tsx
  - [x] src/vite-env.d.ts
  - [x] src/styles/globals.css
  - [x] src/lib/utils.ts
  - [x] src/config/env.ts
  - [x] src/services/supabase.ts

---

## Phase 2: Dependencies Installation 🔄

- [x] Install dependencies (100% Ant Design + styled-components)
  ```bash
  # Core
  yarn add react react-dom react-router-dom zustand @supabase/supabase-js

  # UI - Ant Design
  yarn add antd @ant-design/icons

  # Styling
  yarn add styled-components
  yarn add -D @types/styled-components

  # Form & Validation
  yarn add zod

  # Utils
  yarn add dayjs

  # Dev dependencies
  yarn add -D @types/node @biomejs/biome
  ```

- [x] ❌ shadcn/ui 설치 안 함 (사용하지 않음)

- [x] ❌ Tailwind CSS 설치 안 함 (사용하지 않음)

---

## Phase 3: Supabase Setup 📦

- [x] Create Supabase directory structure
  ```bash
  mkdir -p supabase/migrations
  mkdir -p supabase/functions/{submit-prompt,advance-round,get-my-rank}
  ```

- [x] Create initial migration file
  - [x] Copy SQL from docs/DB_DESIGN.md to migration
  - [x] Create: supabase/migrations/20250101000000_initial_schema.sql

- [ ] Setup Supabase project (Manual - requires user action)
  - [ ] Create Supabase project at supabase.com
  - [ ] Copy project URL and anon key to .env
  - [ ] Run migrations (via Supabase dashboard or CLI)

---

## Phase 4: Type Definitions 📝

- [ ] Create database types (after Supabase setup)
  ```bash
  # If using Supabase CLI
  supabase gen types typescript --local > src/types/database.types.ts
  ```

- [ ] Create type files
  - [ ] src/types/auth.types.ts
  - [ ] src/types/character.types.ts
  - [ ] src/types/game.types.ts
  - [ ] src/types/leaderboard.types.ts
  - [ ] src/types/api.types.ts

---

## Phase 5: Utility Functions 🔧

- [ ] Create utility files
  - [ ] src/utils/formatters.ts (date, number formatting)
  - [ ] src/utils/validators.ts (validation functions)
  - [ ] src/utils/constants.ts (app constants)
  - [ ] src/utils/helpers.ts (helper functions)

---

## Phase 6: Services Layer 🌐

- [ ] Create API services
  - [ ] src/services/auth.service.ts
  - [ ] src/services/character.service.ts
  - [ ] src/services/prompt.service.ts
  - [ ] src/services/leaderboard.service.ts
  - [ ] src/services/realtime.service.ts

---

## Phase 7: State Management (Zustand) 🗄️

- [ ] Create stores
  - [ ] src/store/authStore.ts
  - [ ] src/store/characterStore.ts
  - [ ] src/store/gameStore.ts
  - [ ] src/store/uiStore.ts (toast, modal, etc.)

---

## Phase 8: Custom Hooks 🪝

- [ ] Create custom hooks
  - [ ] src/hooks/useAuth.ts
  - [ ] src/hooks/useCharacter.ts
  - [ ] src/hooks/useLeaderboard.ts
  - [ ] src/hooks/usePromptSubmit.ts
  - [ ] src/hooks/useRoundTimer.ts
  - [ ] src/hooks/useToast.ts

---

## Phase 9: Common Components 🧩

- [ ] Layout components
  - [ ] src/components/layout/Header.tsx
  - [ ] src/components/layout/Footer.tsx
  - [ ] src/components/layout/Navigation.tsx
  - [ ] src/components/layout/Container.tsx
  - [ ] src/components/layout/BottomNavigation.tsx

- [ ] Common components (using shadcn/ui as base)
  - [ ] src/components/common/Loading.tsx
  - [ ] src/components/common/ErrorBoundary.tsx
  - [ ] src/components/common/Skeleton.tsx

---

## Phase 10: Auth Components 🔐

- [ ] Auth components
  - [ ] src/components/auth/LoginForm.tsx
  - [ ] src/components/auth/SignupForm.tsx
  - [ ] src/components/auth/AuthGuard.tsx

- [ ] Auth pages
  - [ ] src/pages/Auth/Login.tsx
  - [ ] src/pages/Auth/Signup.tsx

---

## Phase 11: Game Components 🎮

- [ ] Game components
  - [ ] src/components/game/RoundTimer.tsx
  - [ ] src/components/game/RoundInfo.tsx
  - [ ] src/components/game/PromptHistory.tsx

- [ ] Character components
  - [ ] src/components/character/CharacterCard.tsx
  - [ ] src/components/character/CharacterStats.tsx
  - [ ] src/components/character/CharacterCreation.tsx
  - [ ] src/components/character/PromptInput.tsx

---

## Phase 12: Leaderboard Components 🏆

- [ ] Leaderboard components
  - [ ] src/components/leaderboard/LeaderboardList.tsx
  - [ ] src/components/leaderboard/LeaderboardItem.tsx
  - [ ] src/components/leaderboard/RankBadge.tsx
  - [ ] src/components/leaderboard/MyRankCard.tsx

---

## Phase 13: Pages Implementation 📄

- [ ] Public pages
  - [ ] src/pages/Landing.tsx
  - [ ] src/pages/NotFound.tsx

- [ ] Game pages
  - [ ] src/pages/Game/Dashboard.tsx
  - [ ] src/pages/Game/PromptSubmit.tsx (optional)
  - [ ] src/pages/Game/History.tsx

- [ ] Leaderboard pages
  - [ ] src/pages/Leaderboard/Current.tsx
  - [ ] src/pages/Leaderboard/Past.tsx

- [ ] Profile pages
  - [ ] src/pages/Profile/MyProfile.tsx
  - [ ] src/pages/Profile/EditProfile.tsx

---

## Phase 14: Routing Setup 🛣️

- [ ] Setup React Router
  - [ ] Update src/App.tsx with routes
  - [ ] Add route protection with AuthGuard
  - [ ] Add route transitions (Framer Motion)

---

## Phase 15: Realtime Features ⚡

- [ ] Implement realtime subscriptions
  - [ ] Leaderboard live updates
  - [ ] Round changes notifications
  - [ ] Character updates

---

## Phase 16: Edge Functions Implementation (100% Supabase) 🔥

### 16.1. Shared Utilities
- [ ] `supabase/functions/_shared/adminAuth.ts` - Admin 권한 확인 유틸리티
- [ ] `supabase/functions/_shared/cors.ts` - CORS 헤더 유틸리티
- [ ] `supabase/functions/_shared/response.ts` - 응답 포맷 유틸리티

### 16.2. User Edge Functions
- [ ] `supabase/functions/submit-prompt/index.ts` - 프롬프트 제출
- [ ] `supabase/functions/get-my-rank/index.ts` - 내 순위 조회
- [ ] AI 점수 평가 로직 (OpenAI/Claude/Gemini API 연동)

### 16.3. Admin Round Management Edge Functions
- [ ] `supabase/functions/admin-rounds-create/index.ts` - 라운드 생성
- [ ] `supabase/functions/admin-rounds-start/index.ts` - 라운드 시작
- [ ] `supabase/functions/admin-rounds-end/index.ts` - 라운드 종료
- [ ] `supabase/functions/admin-rounds-extend/index.ts` - 라운드 연장
- [ ] `supabase/functions/admin-rounds-cancel/index.ts` - 라운드 취소

### 16.4. Admin Statistics Edge Functions
- [ ] `supabase/functions/admin-stats/index.ts` - 전체 통계
- [ ] `supabase/functions/admin-stats-rounds/index.ts` - 라운드별 통계
- [ ] `supabase/functions/admin-stats-users/index.ts` - 사용자 통계

### 16.5. Admin Prompt Management Edge Functions
- [ ] `supabase/functions/admin-prompts/index.ts` - 프롬프트 목록 조회
- [ ] `supabase/functions/admin-prompts-delete/index.ts` - 프롬프트 삭제 (소프트 삭제)
- [ ] 점수 롤백 로직 구현

### 16.6. Admin User Management Edge Functions
- [ ] `supabase/functions/admin-users/index.ts` - 사용자 검색
- [ ] `supabase/functions/admin-users-ban/index.ts` - 사용자 제재
- [ ] `supabase/functions/admin-users-unban/index.ts` - 사용자 제재 해제

### 16.7. Admin Audit Log Edge Function
- [ ] `supabase/functions/admin-audit-log/index.ts` - Audit Log 조회
- [ ] 모든 Admin 행동에 로그 추가

### 16.8. Edge Functions 배포
- [ ] Supabase Secrets 설정 (AI API 키, 환경 변수 등)
- [ ] Deploy all Edge Functions
  ```bash
  supabase functions deploy submit-prompt
  supabase functions deploy get-my-rank
  supabase functions deploy admin-rounds-start
  supabase functions deploy admin-rounds-end
  supabase functions deploy admin-stats
  # ... 나머지 Admin Functions
  ```

### 16.9. Rate Limiting (Edge Functions 내부)
- [ ] User API Rate Limiting (Deno KV 또는 Upstash Redis)
- [ ] Admin API Rate Limiting (더 엄격)

---

## Phase 17: Testing & Verification ✅

- [ ] Run format and lint
  ```bash
  yarn format
  yarn lint
  ```

- [ ] Type check
  ```bash
  yarn type-check
  ```

- [ ] Build project
  ```bash
  yarn build
  ```

- [ ] Test development server
  ```bash
  yarn dev
  ```

- [ ] Manual testing
  - [ ] User registration/login
  - [ ] Character creation
  - [ ] Prompt submission
  - [ ] Leaderboard display
  - [ ] Real-time updates
  - [ ] Mobile responsiveness

---

## Phase 18: Admin Panel UI 👨‍💼

- [ ] Admin authentication pages
  - [ ] Admin login page
  - [ ] Admin 권한 확인 가드

- [ ] Admin Dashboard
  - [ ] 전체 통계 카드 (사용자 수, 프롬프트 수, 라운드 수)
  - [ ] 현재 라운드 정보 위젯
  - [ ] 최근 활동 로그

- [ ] Round Management Page
  - [ ] 라운드 생성 폼
  - [ ] 예정된 라운드 목록
  - [ ] 현재 활성 라운드 컨트롤 (시작/종료/연장)
  - [ ] 과거 라운드 히스토리

- [ ] Prompt Moderation Page
  - [ ] 프롬프트 목록 (필터링, 검색)
  - [ ] 프롬프트 삭제 버튼 + 사유 입력
  - [ ] 점수 롤백 확인 모달

- [ ] User Management Page
  - [ ] 사용자 검색
  - [ ] 사용자 상세 정보 (캐릭터, 통계)
  - [ ] 제재/해제 버튼

- [ ] Statistics Page
  - [ ] 차트 라이브러리 (recharts, chart.js 등)
  - [ ] 라운드별 통계 차트
  - [ ] 사용자 참여율 그래프
  - [ ] 점수 분포 히스토그램

- [ ] Audit Log Page
  - [ ] Admin 행동 로그 테이블
  - [ ] 필터링 (액션, Admin, 날짜)
  - [ ] 페이지네이션

---

## Phase 19: Polish & Optimization ✨

- [ ] Add animations (Framer Motion)
  - [ ] Page transitions
  - [ ] Score update animations
  - [ ] Rank badge glow effects

- [ ] Accessibility improvements
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast check

- [ ] Performance optimization
  - [ ] Code splitting with React.lazy()
  - [ ] Image optimization
  - [ ] Memoization (React.memo, useMemo, useCallback)
  - [ ] Virtual scrolling for leaderboard

---

## Phase 20: Documentation 📚

- [ ] Update README.md
- [ ] Add inline code comments
- [ ] Create component documentation
- [ ] Add API usage examples

---

## Phase 21: Deployment 🚀

- [ ] Setup environment variables for production
- [ ] Build production bundle
  ```bash
  yarn build
  ```

- [ ] Deploy to hosting (Vercel/Netlify)
  - [ ] Connect GitHub repository
  - [ ] Configure build settings
  - [ ] Set environment variables
  - [ ] Deploy

- [ ] Admin Setup
  - [ ] 초기 super_admin 계정 생성 (DB 직접 INSERT)
  - [ ] Admin Panel 접근 URL 설정 (예: /admin)
  - [ ] Admin 권한 테스트

---

## Current Status

**Completed**:
- Phase 1 - Initial Setup ✅
- Phase 2 - Dependencies Installation ✅
- Phase 3 - Supabase Setup ✅ (Directory structure and migration file ready)

**Next Up**: Phase 4 - Type Definitions

**NEW: 100% Supabase Edge Functions 아키텍처** 🆕
- Admin 기반 라운드 관리 시스템 추가
- 모든 API를 Supabase Edge Functions (Deno)로 구현
- Cron Job 제거 → Admin이 수동으로 라운드 제어
- Admin Panel UI 구현 필요

**To Start Development**:
1. Run `yarn install`
2. Setup shadcn/ui with `npx shadcn-ui@latest init`
3. Create Supabase project and update `.env`
4. Run database migrations (`supabase db push`)
5. Create initial super_admin account (직접 DB INSERT)
6. Implement Edge Functions in `supabase/functions/`
7. Deploy Edge Functions (`supabase functions deploy`)

**아키텍처 특징:**
- ✅ 100% Supabase: Auth + Database + Realtime + Edge Functions
- ✅ 프론트엔드: Client SDK로 읽기 전용 직접 접근 (리더보드 등)
- ✅ 쓰기 작업: 모든 Edge Functions를 통해서만 수행
- ✅ Admin 시스템: Edge Functions로 라운드 수동 관리
- ✅ 배포: `supabase functions deploy` 명령어로 간단 배포
- ✅ 로그: Supabase Dashboard에서 Edge Functions 로그 실시간 확인

---

## Notes

- Remember to run `yarn format && yarn build` before committing
- Use Biome.js for consistent code style
- Follow mobile-first design approach
- Test on real mobile devices
- Keep accessibility in mind from the start
