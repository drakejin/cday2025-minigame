# 🚀 Quick Deployment Guide

5분 안에 배포하기 - 가장 빠른 방법

## 📋 Prerequisites

1. **Supabase 프로젝트 생성**
   - https://supabase.com 에서 계정 생성
   - 새 프로젝트 생성
   - 프로젝트 이름 입력
   - Database password 설정
   - Region 선택 (Northeast Asia - Seoul 추천)

2. **Google OAuth 설정**
   - Supabase Dashboard > Authentication > Providers > Google
   - Google Cloud Console에서 OAuth 클라이언트 생성
   - Redirect URI: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

3. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   cp .env.example .env

   # 다음 값들을 채워넣기:
   # - VITE_SUPABASE_URL (Settings > API)
   # - VITE_SUPABASE_ANON_KEY (Settings > API)
   # - VITE_SUPABASE_ACCESS_TOKEN (Settings > API > service_role)
   # - SUPABASE_PROJECT_REF (Settings > General > Reference ID)
   ```

---

## 🎯 One-Command Deployment

```bash
# 모든 것을 자동으로 배포
./deploy.sh
```

이 스크립트가 자동으로:
1. ✅ Code quality 체크 (format, lint, type-check, build)
2. ✅ Edge Functions 배포 (27개)
3. ✅ Frontend 배포 (Vercel)
4. ✅ 배포 결과 요약

---

## 📝 Manual Step-by-Step (선호하는 경우)

### Step 1: Build
```bash
yarn build
```

### Step 2: Deploy Edge Functions
```bash
./deploy-edge-functions.sh
```

### Step 3: Deploy Frontend to Vercel
```bash
# 한 번만
vercel login

# 첫 배포
vercel

# 환경 변수 추가
echo "https://your-project.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "your-anon-key" | vercel env add VITE_SUPABASE_ANON_KEY production

# Production 배포
vercel --prod
```

### Step 4: Create Admin Account
Supabase SQL Editor에서:
```sql
-- Google OAuth로 로그인 후 실행
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

### Step 5: Create First Round
1. `https://your-app.vercel.app/admin` 접속
2. Rounds 메뉴 > Create Round
3. 시작/종료 시간 설정
4. Start Round 클릭

---

## ✅ Verification

```bash
# Edge Functions 로그 확인
supabase functions logs submit-prompt

# Frontend 접속
open https://your-app.vercel.app
```

**테스트 항목:**
- [ ] Google 로그인 동작
- [ ] 캐릭터 생성
- [ ] 프롬프트 제출
- [ ] 리더보드 실시간 업데이트
- [ ] Admin 페이지 접근

---

## 🔧 Troubleshooting

### "No credentials found" 에러
```bash
vercel login
```

### Edge Functions 배포 실패
```bash
# Token 재설정
export SUPABASE_ACCESS_TOKEN=$VITE_SUPABASE_ACCESS_TOKEN

# 재시도
./deploy-edge-functions.sh
```

### Build 실패
```bash
# Dependencies 재설치
rm -rf node_modules yarn.lock
yarn install
yarn build
```

---

## 📊 Expected Results

### Edge Functions (27개)
```
✅ submit-prompt
✅ get-current-round
✅ create-character
... (24 more)
```

### Frontend
```
✅ Deployed to: https://your-app.vercel.app
✅ Admin Panel: https://your-app.vercel.app/admin
```

### Bundle Size
```
- Total vendors: ~426 kB (gzipped)
- Each page: 0.6~6 kB (gzipped)
```

---

## 🎯 Next Steps After Deployment

1. Test all features
2. Create first game round
3. Invite users
4. Monitor Edge Functions logs
5. (Optional) Connect custom domain

---

## 📞 Need Help?

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Setup guide: [CLAUDE.md](./CLAUDE.md)
- Issues: GitHub Issues
