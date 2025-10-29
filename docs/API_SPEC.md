# API Specification

## Base URL
```
Development: http://localhost:54321
Production: https://your-project.supabase.co
```

## Authentication
```
Authorization: Bearer <access_token>
```

---

## User APIs

### 1. Auth (Google OAuth Only)

#### 프론트엔드에서 Google OAuth 시작
```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`,
  },
})
```

**자동 처리:**
- 구글 로그인 완료 후 자동으로 `profiles` 테이블에 사용자 생성
- `display_name`: 구글 계정 이름
- `avatar_url`: 구글 프로필 이미지
- `email`: 구글 계정 이메일

#### POST /auth/v1/logout
로그아웃

---

### 2. Character (Edge Functions)

#### GET /functions/v1/get-my-character
내 캐릭터 조회
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "용사 김철수",
    "current_prompt": "불꽃을 다루는 마법사",
    "total_score": 150,
    "strength": 50,
    "charm": 45,
    "creativity": 55
  }
}
```

#### POST /functions/v1/create-character
캐릭터 생성
```json
Request:
{
  "name": "용사 김철수"
}
  .single()
```

---

### 3. Prompt Submission (Edge Function)

#### POST /functions/v1/submit-prompt
```json
Request:
{
  "character_id": "uuid",
  "prompt": "불꽃을 다루는 마법사"
}

Response:
{
  "success": true,
  "data": {
    "scores": {
      "strength": 15,
      "charm": 20,
      "creativity": 25,
      "total": 60
    }
  }
}

Errors:
- ALREADY_SUBMITTED (400): 이미 제출함
- INVALID_PROMPT_LENGTH (400): 30자 초과
- ROUND_NOT_ACTIVE (400): 활성 라운드 없음
```

---

### 4. Leaderboard (Direct DB Access - 읽기만)

```typescript
// 현재 리더보드
const { data } = await supabase
  .from('characters')
  .select('*, profiles(*)')
  .eq('is_active', true)
  .order('total_score', { ascending: false })
  .limit(100)

// 과거 라운드 리더보드
const { data } = await supabase
  .from('leaderboard_snapshots')
  .select('*, profiles(*)')
  .eq('round_number', 5)
  .order('rank')
  .limit(100)
```

---

### 5. Round Info (Direct DB Access - 읽기만)

```typescript
// 현재 라운드 조회
const { data } = await supabase
  .from('game_rounds')
  .select('*')
  .eq('is_active', true)
  .single()
```

---

## Admin APIs (Edge Functions)

**모든 Admin API는 Edge Function 내부에서 admin_users 테이블 확인**

### 1. Round Management

#### POST /functions/v1/admin-rounds-create
```json
Request:
{
  "round_number": 6,
  "start_time": "2025-01-15T11:00:00Z",
  "end_time": "2025-01-15T12:00:00Z"
}
```

#### POST /functions/v1/admin-rounds-start
```json
Request:
{
  "round_id": "uuid"
}
```

#### POST /functions/v1/admin-rounds-end
```json
Request:
{
  "notes": "정상 종료"
}

Response:
{
  "success": true,
  "snapshot_created": true
}
```

#### POST /functions/v1/admin-rounds-extend
```json
Request:
{
  "round_id": "uuid",
  "extend_minutes": 30
}
```

---

### 2. Prompt Moderation

#### GET /functions/v1/admin-prompts?round=5&page=1&limit=50
프롬프트 목록 조회

#### POST /functions/v1/admin-prompts-delete
```json
Request:
{
  "prompt_id": "uuid",
  "reason": "부적절한 언어 사용"
}

Response:
{
  "success": true,
  "rollbackScore": {
    "strength": -8,
    "charm": -5,
    "creativity": -7,
    "total": -20
  }
}
```

---

### 3. User Management

#### GET /functions/v1/admin-users?search=player1&page=1
사용자 검색

#### POST /functions/v1/admin-users-ban
```json
Request:
{
  "user_id": "uuid",
  "reason": "규정 위반",
  "duration": "7d"
}
```

#### POST /functions/v1/admin-users-unban
```json
Request:
{
  "user_id": "uuid"
}
```

---

### 4. Statistics

#### GET /functions/v1/admin-stats
```json
Response:
{
  "totalUsers": 1500,
  "totalCharacters": 1200,
  "totalPrompts": 5400,
  "currentRound": {
    "round_number": 5,
    "status": "active",
    "participants": 450
  }
}
```

---

### 5. Audit Log

#### GET /functions/v1/admin-audit-log?page=1&action=START_ROUND
Admin 행동 로그 조회

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_PROMPT_LENGTH | 400 | 30자 초과 |
| ALREADY_SUBMITTED | 400 | 이미 제출함 |
| ROUND_NOT_ACTIVE | 400 | 활성 라운드 없음 |
| UNAUTHORIZED | 401 | 인증 필요 |
| ADMIN_FORBIDDEN | 403 | Admin 권한 없음 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 제한 초과 |

---

## Rate Limiting

**User APIs:**
- 프롬프트 제출: 라운드당 1회
- 리더보드 조회: 분당 30회

**Admin APIs:**
- 라운드 관리: 분당 10회
- 프롬프트 삭제: 시간당 50회
- 사용자 제재: 시간당 20회

---

## Realtime Subscriptions

```typescript
// 리더보드 실시간 업데이트
supabase
  .channel('leaderboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'characters'
  }, (payload) => {
    // 리더보드 업데이트
  })
  .subscribe()

// 라운드 변경 알림
supabase
  .channel('rounds')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'game_rounds'
  }, (payload) => {
    // 라운드 정보 업데이트
  })
  .subscribe()
```

---

## 중요 포인트

1. **User API**: 읽기는 Direct DB Access, 쓰기는 Edge Functions
2. **Admin API**: 모든 작업은 Edge Functions
3. **Admin 권한 확인**: Edge Function 내부에서 admin_users 테이블 조회
4. **Realtime**: Supabase Realtime으로 리더보드/라운드 실시간 업데이트
