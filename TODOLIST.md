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

- [ ] Install dependencies
  ```bash
  yarn install
  ```

- [ ] Setup shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```

- [ ] Add shadcn/ui components
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
  npx shadcn-ui@latest add label
  ```

---

## Phase 3: Supabase Setup 📦

- [ ] Create Supabase directory structure
  ```bash
  mkdir -p supabase/migrations
  mkdir -p supabase/functions/{submit-prompt,advance-round,get-my-rank}
  ```

- [ ] Create initial migration file
  - [ ] Copy SQL from docs/DB_DESIGN.md to migration
  - [ ] Create: supabase/migrations/20250101000000_initial_schema.sql

- [ ] Setup Supabase project (Manual)
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

## Phase 16: Supabase Edge Functions 🔥

- [ ] Create Edge Functions
  - [ ] supabase/functions/submit-prompt/index.ts
  - [ ] supabase/functions/advance-round/index.ts
  - [ ] supabase/functions/get-my-rank/index.ts

- [ ] Deploy Edge Functions
  ```bash
  supabase functions deploy submit-prompt
  supabase functions deploy advance-round
  supabase functions deploy get-my-rank
  ```

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

## Phase 18: Polish & Optimization ✨

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

## Phase 19: Documentation 📚

- [ ] Update README.md
- [ ] Add inline code comments
- [ ] Create component documentation
- [ ] Add API usage examples

---

## Phase 20: Deployment 🚀

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

- [ ] Setup Supabase Cron for round advancement
  - [ ] Configure hourly job to call advance-round function

---

## Current Status

**Completed**: Phase 1 - Initial Setup ✅

**Next Up**: Phase 2 - Dependencies Installation

**To Start Development**:
1. Run `yarn install`
2. Setup shadcn/ui with `npx shadcn-ui@latest init`
3. Create Supabase project and update `.env`
4. Start implementing types and services

---

## Notes

- Remember to run `yarn format && yarn build` before committing
- Use Biome.js for consistent code style
- Follow mobile-first design approach
- Test on real mobile devices
- Keep accessibility in mind from the start
