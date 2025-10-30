# Google OAuth Setup Guide

## Supabase Dashboard 설정

### 1. Google OAuth Provider 활성화

1. Supabase Dashboard 접속
2. **Authentication** > **Providers** 메뉴로 이동
3. **Google** 선택
4. **Enable Sign in with Google** 활성화

### 2. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** > **Credentials** 이동
4. **Create Credentials** > **OAuth 2.0 Client ID** 선택
5. Application type: **Web application**
6. Authorized redirect URIs 추가:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   예시:
   ```
   https://oapwrpmohheorgbweeon.supabase.co/auth/v1/callback
   ```

7. **Client ID**와 **Client Secret** 복사

### 3. Supabase에 Google Credentials 입력

Supabase Dashboard > Authentication > Providers > Google:
- **Client ID (for OAuth)**: Google에서 받은 Client ID 입력
- **Client Secret (for OAuth)**: Google에서 받은 Client Secret 입력
- **Save** 클릭

### 4. Authorized Domains 추가 (선택)

Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**:
  ```
  https://your-domain.com/dashboard
  http://localhost:3000/dashboard
  ```

---

## 로컬 개발 테스트

### 1. Redirect URL 설정

로컬 개발 시 Google Cloud Console에 추가:
```
http://localhost:54321/auth/v1/callback
```

### 2. 테스트

1. `yarn dev` 실행
2. `http://localhost:3000/login` 접속
3. "Google로 시작하기" 버튼 클릭
4. 구글 계정 선택
5. 권한 승인
6. `/dashboard`로 리다이렉트 확인

---

## 프로덕션 배포

### Vercel/Netlify 배포 시

1. **Environment Variables** 설정:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Google Authorized Redirect URIs** 추가:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

3. **Supabase Redirect URLs** 설정:
   ```
   https://your-domain.vercel.app/dashboard
   ```

---

## Troubleshooting

### 문제: "Redirect URI mismatch" 오류

**해결:**
- Google Cloud Console에 정확한 Supabase callback URL 추가 확인
- Format: `https://<project-ref>.supabase.co/auth/v1/callback`

### 문제: 로그인 후 리다이렉트 안 됨

**해결:**
- Supabase Dashboard > Authentication > URL Configuration 확인
- Site URL과 Redirect URLs 정확히 설정

### 문제: "OAuth client not found"

**해결:**
- Supabase에 Google Client ID/Secret 정확히 입력했는지 확인
- Google Cloud Console에서 OAuth 2.0 Client ID 생성 확인

---

## 현재 프로젝트 설정

**Supabase URL**: `https://oapwrpmohheorgbweeon.supabase.co`

**필요한 Redirect URI**:
```
https://oapwrpmohheorgbweeon.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback (로컬 테스트용)
```

**Redirect To**:
```
http://localhost:3000/dashboard (로컬)
https://your-domain.com/dashboard (프로덕션)
```
