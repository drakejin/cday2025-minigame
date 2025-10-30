# Deployment Checklist 🚀

이 문서는 프로덕션 배포를 위한 단계별 체크리스트입니다.

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Supabase 프로젝트 생성
  - [ ] https://supabase.com 에서 새 프로젝트 생성
  - [ ] Project URL 확인: `https://[PROJECT-REF].supabase.co`
  - [ ] Anon Key 확인: Settings > API > `anon` public key
  - [ ] Service Role Key 확인: Settings > API > `service_role` secret key

- [ ] Database Migration
  ```bash
  # Supabase CLI로 프로젝트 링크
  supabase link --project-ref [YOUR-PROJECT-REF]

  # Migration 실행
  supabase db push
  ```

- [ ] Google OAuth 설정
  - [ ] Supabase Dashboard > Authentication > Providers > Google
  - [ ] Google Cloud Console에서 OAuth 클라이언트 생성
  - [ ] Authorized redirect URIs 추가:
    - `https://[PROJECT-REF].supabase.co/auth/v1/callback`
  - [ ] Client ID와 Secret을 Supabase에 입력

### 2. Environment Variables
- [ ] `.env` 파일에 다음 변수 설정:
  ```env
  VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
  VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
  VITE_SUPABASE_ACCESS_TOKEN=[YOUR-SERVICE-ROLE-KEY]
  ```

### 3. Code Quality Check
```bash
# 모든 체크 실행
yarn format
yarn lint
yarn type-check
yarn build
```

- [ ] ✅ Format 통과
- [ ] ✅ Lint 통과 (warnings 허용)
- [ ] ✅ Type check 통과
- [ ] ✅ Build 성공

---

## 🚀 Deployment Steps

### Step 1: Deploy Edge Functions (27개)

```bash
# 환경 변수 설정
export SUPABASE_ACCESS_TOKEN=$VITE_SUPABASE_ACCESS_TOKEN

# 자동 배포 스크립트 실행
./deploy-edge-functions.sh
```

**또는 수동 배포:**
```bash
# User Functions (11개)
supabase functions deploy submit-prompt
supabase functions deploy get-current-round
supabase functions deploy get-my-prompts
supabase functions deploy get-my-character
supabase functions deploy create-character
supabase functions deploy update-character-name
supabase functions deploy get-round-info
supabase functions deploy get-leaderboard
supabase functions deploy get-past-leaderboard
supabase functions deploy get-my-rank
supabase functions deploy update-profile

# Admin Functions (16개)
supabase functions deploy admin-rounds-create
supabase functions deploy admin-rounds-start
supabase functions deploy admin-rounds-end
supabase functions deploy admin-rounds-extend
supabase functions deploy admin-rounds-cancel
supabase functions deploy admin-rounds-list
supabase functions deploy admin-prompts-list
supabase functions deploy admin-prompts-delete
supabase functions deploy admin-users-list
supabase functions deploy admin-users-detail
supabase functions deploy admin-users-ban
supabase functions deploy admin-users-unban
supabase functions deploy admin-stats
supabase functions deploy admin-stats-rounds
supabase functions deploy admin-stats-users
supabase functions deploy admin-audit-log
```

**Verification:**
- [ ] 모든 함수 배포 성공
- [ ] Supabase Dashboard > Edge Functions에서 확인
- [ ] 로그 확인: `supabase functions logs [function-name]`

---

### Step 2: Deploy Frontend to Vercel

#### Option A: Vercel CLI (추천)

```bash
# 1. Vercel CLI 설치 (한 번만)
npm i -g vercel

# 2. 첫 배포 (설정)
vercel

# 3. 환경 변수 추가
vercel env add VITE_SUPABASE_URL production
# 값 입력: https://[PROJECT-REF].supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# 값 입력: [YOUR-ANON-KEY]

# 4. Production 배포
vercel --prod
```

#### Option B: Vercel Dashboard

1. https://vercel.com 접속
2. "Add New Project" 클릭
3. GitHub repository 선택
4. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `yarn build`
   - **Output Directory**: `dist`
   - **Install Command**: `yarn install`
5. Environment Variables 추가:
   - `VITE_SUPABASE_URL` = `https://[PROJECT-REF].supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `[YOUR-ANON-KEY]`
6. "Deploy" 클릭

**Verification:**
- [ ] 배포 성공
- [ ] URL 확인: `https://[your-project].vercel.app`
- [ ] Domain 설정 (선택)

---

### Step 3: Post-Deployment Setup

#### 1. Create Super Admin Account

Supabase SQL Editor에서 실행:
```sql
-- 1. 먼저 Google OAuth로 로그인하여 profiles 레코드 생성

-- 2. 본인 이메일을 super_admin으로 승격
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- 3. 확인
SELECT id, email, role, created_at
FROM profiles
WHERE role IN ('admin', 'super_admin');
```

- [ ] Super admin 계정 생성 완료
- [ ] `/admin` 페이지 접근 확인

#### 2. Create First Round

Admin Panel에서:
1. `/admin/rounds` 접속
2. "라운드 생성" 클릭
3. 시작/종료 시간 설정
4. "라운드 시작" 클릭

- [ ] 첫 라운드 생성 및 시작

---

## ✅ Deployment Verification

### Frontend Verification
- [ ] 메인 페이지 로딩 확인
- [ ] Google OAuth 로그인 동작 확인
- [ ] 로그인 후 Dashboard 접근 확인
- [ ] 캐릭터 생성 기능 동작 확인
- [ ] 프롬프트 제출 기능 동작 확인
- [ ] 리더보드 표시 확인
- [ ] 실시간 업데이트 동작 확인 (다른 브라우저에서 테스트)

### Admin Panel Verification
- [ ] `/admin` 접근 확인 (super_admin만)
- [ ] Dashboard 통계 표시 확인
- [ ] 라운드 관리 기능 확인
  - [ ] 라운드 생성
  - [ ] 라운드 시작
  - [ ] 라운드 종료
- [ ] 프롬프트 관리 확인
  - [ ] 프롬프트 목록 조회
  - [ ] 프롬프트 삭제 (+ 점수 롤백)
- [ ] 사용자 관리 확인
  - [ ] 사용자 검색
  - [ ] 사용자 상세 정보
  - [ ] 제재/해제 기능
- [ ] 통계 페이지 확인
- [ ] Audit Log 확인

### Edge Functions Verification
```bash
# 각 함수 로그 확인
supabase functions logs submit-prompt --limit 50
supabase functions logs get-current-round --limit 50
supabase functions logs admin-rounds-start --limit 50
```

- [ ] Edge Functions 정상 동작 확인
- [ ] 에러 로그 없음 확인

### Mobile Verification
- [ ] 모바일 브라우저에서 접속
- [ ] 반응형 레이아웃 확인
- [ ] 하단 네비게이션 동작 확인
- [ ] 터치 인터랙션 확인

---

## 🔧 Troubleshooting

### Issue: Edge Functions 배포 실패
```bash
# Access token 재설정
export SUPABASE_ACCESS_TOKEN=[YOUR-SERVICE-ROLE-KEY]

# 프로젝트 재링크
supabase link --project-ref [YOUR-PROJECT-REF]

# 개별 함수 재배포
supabase functions deploy [function-name] --no-verify-jwt
```

### Issue: Vercel 빌드 실패
- Environment variables 확인
- Build command 확인: `yarn build`
- Output directory 확인: `dist`
- Node version 확인: 18.x 이상

### Issue: Google OAuth 로그인 실패
- Google Cloud Console에서 Redirect URI 확인
- Supabase Dashboard에서 Google Provider 활성화 확인
- Client ID/Secret 확인

### Issue: Admin 페이지 접근 안 됨
- SQL로 role 확인:
  ```sql
  SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
  ```
- `super_admin` 또는 `admin` 역할 확인

---

## 📊 Performance Metrics

### Bundle Size (Gzipped)
- React vendor: 16.21 kB
- Ant Design vendor: 342.27 kB
- Supabase vendor: 44.62 kB
- Query vendor: 12.40 kB
- UI vendor: 10.89 kB
- Total vendors: ~426.39 kB
- Pages: 0.6~6 kB each

### Loading Performance
- Initial load: Vendor chunks + Landing page
- Lazy load: Each page loaded on-demand
- Cache: Vendor chunks cached separately

---

## 🎯 Post-Deployment Tasks

1. [ ] 도메인 연결 (선택)
2. [ ] Analytics 설정 (선택)
3. [ ] Error monitoring (Sentry 등, 선택)
4. [ ] Performance monitoring
5. [ ] User feedback 수집

---

## 📞 Support

- Issues: GitHub Issues
- Documentation: [CLAUDE.md](./CLAUDE.md)
- API Spec: [docs/API_SPEC.md](./docs/API_SPEC.md)
