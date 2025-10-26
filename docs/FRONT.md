# Frontend Design

## Overview
Vite.js + React + TypeScript 기반 모바일 우선 웹 애플리케이션입니다.

## Tech Stack
- **Framework**: Vite + React 18+ + TypeScript
- **State Management**: Zustand (경량 상태 관리)
- **Styling**: Tailwind CSS (모바일 우선 반응형)
- **Router**: React Router v6
- **HTTP Client**: Supabase JS Client
- **Form**: React Hook Form + Zod (유효성 검증)
- **UI Components**: Headless UI + Custom Components
- **Animation**: Framer Motion
- **Real-time**: Supabase Realtime

---

## Project Structure

```
src/
├── main.tsx                    # 앱 엔트리 포인트
├── App.tsx                     # 루트 컴포넌트
├── vite-env.d.ts              # Vite 타입 정의
│
├── assets/                     # 정적 리소스
│   ├── images/
│   └── fonts/
│
├── components/                 # 재사용 가능한 컴포넌트
│   ├── common/                # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── Toast.tsx
│   │
│   ├── layout/                # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Container.tsx
│   │
│   ├── auth/                  # 인증 관련
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthGuard.tsx
│   │
│   ├── character/             # 캐릭터 관련
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterStats.tsx
│   │   ├── CharacterCreation.tsx
│   │   └── PromptInput.tsx
│   │
│   ├── leaderboard/           # 리더보드 관련
│   │   ├── LeaderboardList.tsx
│   │   ├── LeaderboardItem.tsx
│   │   ├── RankBadge.tsx
│   │   └── MyRankCard.tsx
│   │
│   └── game/                  # 게임 관련
│       ├── RoundTimer.tsx
│       ├── RoundInfo.tsx
│       └── PromptHistory.tsx
│
├── pages/                     # 페이지 컴포넌트
│   ├── Landing.tsx           # 랜딩 페이지
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── Game/
│   │   ├── Dashboard.tsx     # 메인 대시보드
│   │   ├── PromptSubmit.tsx  # 프롬프트 제출
│   │   └── History.tsx       # 내 히스토리
│   ├── Leaderboard/
│   │   ├── Current.tsx       # 현재 리더보드
│   │   └── Past.tsx          # 과거 라운드
│   ├── Profile/
│   │   ├── MyProfile.tsx
│   │   └── EditProfile.tsx
│   └── NotFound.tsx
│
├── hooks/                     # Custom Hooks
│   ├── useAuth.ts
│   ├── useCharacter.ts
│   ├── useLeaderboard.ts
│   ├── usePromptSubmit.ts
│   ├── useRoundTimer.ts
│   └── useToast.ts
│
├── store/                     # Zustand 상태 관리
│   ├── authStore.ts
│   ├── characterStore.ts
│   ├── gameStore.ts
│   └── uiStore.ts
│
├── services/                  # API 서비스
│   ├── supabase.ts           # Supabase 클라이언트 초기화
│   ├── auth.service.ts
│   ├── character.service.ts
│   ├── prompt.service.ts
│   ├── leaderboard.service.ts
│   └── realtime.service.ts
│
├── types/                     # TypeScript 타입 정의
│   ├── auth.types.ts
│   ├── character.types.ts
│   ├── game.types.ts
│   ├── leaderboard.types.ts
│   └── api.types.ts
│
├── utils/                     # 유틸리티 함수
│   ├── formatters.ts         # 날짜, 숫자 포맷팅
│   ├── validators.ts         # 유효성 검증
│   ├── constants.ts          # 상수
│   └── helpers.ts            # 헬퍼 함수
│
├── config/                    # 설정 파일
│   └── env.ts                # 환경 변수
│
└── styles/                    # 전역 스타일
    └── globals.css
```

---

## Page Structure & Routes

### 라우팅 구조
```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

<BrowserRouter>
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Protected Routes */}
    <Route element={<AuthGuard />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/submit" element={<PromptSubmit />} />
      <Route path="/history" element={<History />} />
      <Route path="/leaderboard" element={<CurrentLeaderboard />} />
      <Route path="/leaderboard/:roundNumber" element={<PastLeaderboard />} />
      <Route path="/profile" element={<MyProfile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
    </Route>

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## Pages Detail

### 1. Landing Page (`/`)
**목적**: 서비스 소개 및 시작하기

**컴포넌트 구조**:
```
Landing
├── Hero Section
│   ├── 타이틀: "최강의 캐릭터를 만들어보세요"
│   ├── 설명: "1시간마다 30자로 캐릭터 성장"
│   └── CTA: "시작하기" → /signup
├── How It Works
│   ├── Step 1: 회원가입 및 캐릭터 생성
│   ├── Step 2: 1시간마다 프롬프트 입력
│   └── Step 3: 리더보드에서 순위 확인
├── Features
│   ├── 실시간 리더보드
│   ├── AI 기반 점수 평가
│   └── 캐릭터 성장 히스토리
└── Footer
    ├── 로그인
    └── 회원가입
```

**주요 기능**:
- 서비스 소개 애니메이션
- 현재 TOP 3 리더보드 미리보기
- CTA 버튼 (회원가입/로그인)

---

### 2. Login Page (`/login`)
**목적**: 사용자 로그인

**컴포넌트**:
```
Login
└── LoginForm
    ├── Email Input
    ├── Password Input
    ├── Submit Button: "로그인"
    ├── Link: "비밀번호 찾기"
    └── Link: "회원가입하기" → /signup
```

**유효성 검증**:
- 이메일 형식 검증
- 비밀번호 필수

**성공 시**: `/dashboard`로 리다이렉트

---

### 3. Signup Page (`/signup`)
**목적**: 신규 사용자 회원가입

**컴포넌트**:
```
Signup
└── SignupForm
    ├── Email Input
    ├── Password Input (최소 6자)
    ├── Password Confirm Input
    ├── Username Input (고유값)
    ├── Display Name Input
    ├── Submit Button: "회원가입"
    └── Link: "이미 계정이 있나요? 로그인" → /login
```

**유효성 검증**:
- 이메일 형식 및 중복 확인
- 비밀번호 일치 확인
- 사용자명 중복 확인 (3-20자, 영문+숫자)

**성공 시**: `/dashboard`로 리다이렉트 (자동 로그인)

---

### 4. Dashboard Page (`/dashboard`)
**목적**: 메인 게임 화면 - 모든 정보 한눈에

**컴포넌트 구조**:
```
Dashboard
├── Header
│   ├── Logo
│   ├── Profile Icon
│   └── Logout Button
├── RoundInfo
│   ├── 현재 라운드 번호
│   ├── 남은 시간 (카운트다운)
│   └── 다음 라운드까지
├── MyCharacterCard
│   ├── 캐릭터 이름
│   ├── 현재 프롬프트
│   ├── CharacterStats
│   │   ├── 총점
│   │   ├── 힘 (Strength)
│   │   ├── 매력 (Charm)
│   │   └── 창의성 (Creativity)
│   └── MyRankCard (내 현재 순위)
├── PromptSubmitSection
│   ├── PromptInput (30자 제한)
│   ├── Character Counter: "15/30"
│   └── Submit Button: "제출하기"
│   └── Status: "이미 제출함" (비활성화)
├── QuickLeaderboard (TOP 10)
│   ├── LeaderboardList
│   └── Link: "전체 보기" → /leaderboard
└── BottomNavigation
    ├── Dashboard (현재)
    ├── Leaderboard
    ├── History
    └── Profile
```

**주요 기능**:
- 실시간 라운드 타이머
- 프롬프트 제출 (라운드당 1회)
- 내 캐릭터 정보 실시간 업데이트
- TOP 10 리더보드 미리보기
- 제출 상태 확인

**상태 관리**:
- 현재 라운드 정보
- 내 캐릭터 데이터
- 제출 가능 여부

---

### 5. Prompt Submit Page (`/submit`)
**목적**: 프롬프트 제출 전용 화면 (선택적)

**컴포넌트**:
```
PromptSubmit
├── Header
├── RoundInfo
├── MyCharacterCard (간단 버전)
├── PromptInput
│   ├── Large Textarea (30자)
│   ├── Character Counter
│   ├── Hint: "캐릭터를 강하게 만들 키워드 입력"
│   └── Examples
│       ├── "불을 다루는 용기사"
│       ├── "전설의 치유사"
│       └── "빛나는 암살자"
└── Submit Button: "제출하기"
```

**유효성 검증**:
- 1-30자 제한
- 빈 문자열 방지
- 중복 제출 방지

**성공 시**:
- Toast 알림: "제출 완료!"
- `/dashboard`로 리다이렉트

---

### 6. History Page (`/history`)
**목적**: 내 프롬프트 히스토리 보기

**컴포넌트**:
```
History
├── Header
├── CharacterStats (누적 통계)
├── PromptHistoryList
│   └── HistoryItem[] (최신순)
│       ├── Round Number
│       ├── Prompt
│       ├── Timestamp
│       └── Scores Gained
│           ├── +15 Strength
│           ├── +20 Charm
│           └── +25 Creativity
└── BottomNavigation
```

**주요 기능**:
- 전체 프롬프트 히스토리
- 라운드별 점수 변화
- 무한 스크롤 또는 페이지네이션

---

### 7. Current Leaderboard Page (`/leaderboard`)
**목적**: 현재 전체 리더보드

**컴포넌트**:
```
CurrentLeaderboard
├── Header
├── RoundInfo (현재 라운드)
├── MyRankCard (내 순위 고정)
├── FilterTabs (선택적)
│   ├── 전체
│   ├── Strength
│   ├── Charm
│   └── Creativity
├── LeaderboardList
│   └── LeaderboardItem[]
│       ├── RankBadge (1위: 금, 2위: 은, 3위: 동)
│       ├── Avatar
│       ├── Display Name
│       ├── Character Name
│       ├── Current Prompt
│       └── Stats
│           ├── Total Score
│           ├── Strength
│           ├── Charm
│           └── Creativity
└── BottomNavigation
```

**주요 기능**:
- 실시간 업데이트 (Supabase Realtime)
- 내 순위 강조 표시
- 무한 스크롤 (100명씩)

---

### 8. Past Leaderboard Page (`/leaderboard/:roundNumber`)
**목적**: 과거 라운드 리더보드 보기

**컴포넌트**:
```
PastLeaderboard
├── Header
├── RoundSelector
│   ├── Dropdown: "라운드 선택"
│   └── Navigation: ← Prev | Next →
├── RoundInfo (해당 라운드)
├── LeaderboardList (스냅샷)
└── BottomNavigation
```

**주요 기능**:
- 라운드 히스토리 조회
- 라운드 간 이동

---

### 9. My Profile Page (`/profile`)
**목적**: 내 프로필 및 캐릭터 정보

**컴포넌트**:
```
MyProfile
├── Header
├── ProfileSection
│   ├── Avatar (업로드 가능)
│   ├── Display Name
│   ├── Username
│   ├── Email
│   └── Edit Button → /profile/edit
├── MyCharacterCard (상세)
│   ├── Character Name
│   ├── Created Date
│   ├── Total Rounds Participated
│   ├── Stats
│   └── Current Prompt
├── Statistics
│   ├── Total Score
│   ├── Highest Rank
│   ├── Average Rank
│   └── Total Prompts Submitted
└── BottomNavigation
```

---

### 10. Edit Profile Page (`/profile/edit`)
**목적**: 프로필 수정

**컴포넌트**:
```
EditProfile
├── Header
├── EditForm
│   ├── Avatar Upload
│   ├── Display Name Input
│   ├── Save Button
│   └── Cancel Button
└── CharacterSection
    ├── Character Name Input
    └── Save Button
```

**유효성 검증**:
- Display Name (1-100자)
- Character Name (1-100자)

---

## Mobile-First Design

### Breakpoints
```css
/* Tailwind CSS 기본 breakpoints */
sm: 640px   /* 스마트폰 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 데스크톱 */
```

### Mobile Layout (Default)
- Single column
- Full-width components
- Bottom navigation (fixed)
- 터치 친화적 버튼 크기 (min 44px)
- 스와이프 제스처 지원

### Desktop Layout (lg+)
- Two column (메인 콘텐츠 + 사이드바)
- 사이드바에 리더보드 고정
- Top navigation
- Hover 효과

---

## Components Detail

### 1. RoundTimer
```typescript
interface RoundTimerProps {
  endTime: string
  onRoundEnd?: () => void
}
```
- 실시간 카운트다운
- 00:45:23 형식
- 라운드 종료 시 콜백 실행

### 2. CharacterStats
```typescript
interface CharacterStatsProps {
  strength: number
  charm: number
  creativity: number
  totalScore: number
  showBars?: boolean // 막대 그래프 표시
}
```
- 수치 표시
- 진행 바 (선택적)
- 애니메이션 효과

### 3. PromptInput
```typescript
interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  disabled?: boolean
  placeholder?: string
}
```
- 30자 제한
- 실시간 카운터
- 제출 여부 표시

### 4. LeaderboardItem
```typescript
interface LeaderboardItemProps {
  rank: number
  characterName: string
  displayName: string
  avatarUrl?: string
  prompt: string
  stats: {
    totalScore: number
    strength: number
    charm: number
    creativity: number
  }
  isCurrentUser?: boolean
}
```
- 순위 배지
- 사용자 정보
- 캐릭터 정보
- 현재 사용자 강조

---

## State Management (Zustand)

### authStore
```typescript
interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: UserMetadata) => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}
```

### characterStore
```typescript
interface CharacterState {
  character: Character | null
  isLoading: boolean
  fetchCharacter: () => Promise<void>
  updateCharacter: (data: Partial<Character>) => Promise<void>
}
```

### gameStore
```typescript
interface GameState {
  currentRound: GameRound | null
  timeRemaining: string
  hasSubmittedThisRound: boolean
  isLoading: boolean
  fetchCurrentRound: () => Promise<void>
  checkSubmissionStatus: () => Promise<void>
}
```

### leaderboardStore
```typescript
interface LeaderboardState {
  leaderboard: LeaderboardEntry[]
  myRank: number | null
  isLoading: boolean
  fetchLeaderboard: () => Promise<void>
  fetchMyRank: () => Promise<void>
  subscribeToUpdates: () => void
  unsubscribe: () => void
}
```

---

## Real-time Features

### 1. Leaderboard Auto-refresh
```typescript
// services/realtime.service.ts
export const subscribeToLeaderboard = (callback: () => void) => {
  return supabase
    .channel('leaderboard-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'characters'
    }, callback)
    .subscribe()
}
```

### 2. Round Timer
```typescript
// hooks/useRoundTimer.ts
export const useRoundTimer = (endTime: string) => {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime)
      setTimeRemaining(remaining)

      if (remaining === '00:00:00') {
        // Round ended - trigger refresh
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return timeRemaining
}
```

---

## Performance Optimizations

1. **Code Splitting**: React.lazy()로 페이지별 분리
2. **Image Optimization**: WebP 포맷, lazy loading
3. **Memoization**: React.memo, useMemo, useCallback
4. **Virtual Scrolling**: 리더보드 대량 데이터 처리
5. **Debounce**: 검색, 입력 최적화

---

## Accessibility (a11y)

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader 지원
- Color contrast (WCAG AA)

---

## Animations (Framer Motion)

### Page Transitions
```typescript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}
```

### Score Update Animation
```typescript
const scoreVariants = {
  initial: { scale: 1 },
  update: { scale: [1, 1.2, 1], transition: { duration: 0.5 } }
}
```

### Rank Badge Glow
```typescript
const glowVariants = {
  animate: {
    boxShadow: [
      '0 0 5px gold',
      '0 0 20px gold',
      '0 0 5px gold'
    ],
    transition: { repeat: Infinity, duration: 2 }
  }
}
```

---

## Error Handling & Loading States

### Error Boundary
전역 에러 처리 및 fallback UI

### Loading Skeletons
- 데이터 로딩 중 skeleton UI 표시
- 각 컴포넌트별 skeleton 구현

### Toast Notifications
- 성공/에러/정보 메시지
- 자동 닫힘 (3초)

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Character Battle
```

---

## Next Steps

1. Vite 프로젝트 초기화
2. Supabase 클라이언트 설정
3. 라우팅 구조 구현
4. 공통 컴포넌트 개발
5. 페이지별 구현
6. 상태 관리 통합
7. 실시간 기능 구현
8. 모바일 최적화 및 테스트
