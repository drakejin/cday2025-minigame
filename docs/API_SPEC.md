# API Specification

## Overview
Supabase 기반 REST API 및 Edge Functions 명세서입니다.

## Base URL
```
Development: http://localhost:54321
Production: https://your-project.supabase.co
```

## Authentication
모든 인증된 요청은 Authorization 헤더에 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs (Supabase Auth)

### 1.1. 회원가입
```http
POST /auth/v1/signup
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "data": {
    "username": "player123",
    "display_name": "Player One"
  }
}
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "username": "player123",
      "display_name": "Player One"
    }
  }
}
```

### 1.2. 로그인
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### 1.3. 로그아웃
```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

### 1.4. 토큰 갱신
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json
```

**Request Body**
```json
{
  "refresh_token": "..."
}
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

---

## 2. Profile APIs

### 2.1. 내 프로필 조회
```http
GET /rest/v1/profiles?id=eq.<user_id>&select=*
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "username": "player123",
    "display_name": "Player One",
    "avatar_url": "https://...",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

### 2.2. 프로필 수정
```http
PATCH /rest/v1/profiles?id=eq.<user_id>
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "display_name": "New Name",
  "avatar_url": "https://..."
}
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "username": "player123",
    "display_name": "New Name",
    "avatar_url": "https://...",
    "updated_at": "2025-01-01T01:00:00Z"
  }
]
```

---

## 3. Character APIs

### 3.1. 캐릭터 생성
```http
POST /rest/v1/characters
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body**
```json
{
  "user_id": "uuid",
  "name": "My Hero",
  "current_prompt": "강력한 전사",
  "is_active": true
}
```

**Response (201 Created)**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Hero",
    "current_prompt": "강력한 전사",
    "total_score": 0,
    "strength": 0,
    "charm": 0,
    "creativity": 0,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

### 3.2. 내 캐릭터 조회
```http
GET /rest/v1/characters?user_id=eq.<user_id>&is_active=eq.true&select=*
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Hero",
    "current_prompt": "강력한 전사",
    "total_score": 150,
    "strength": 50,
    "charm": 50,
    "creativity": 50,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T01:00:00Z"
  }
]
```

### 3.3. 캐릭터 수정
```http
PATCH /rest/v1/characters?id=eq.<character_id>
Authorization: Bearer <access_token>
Content-Type: application/json
Prefer: return=representation
```

**Request Body**
```json
{
  "name": "Updated Hero Name"
}
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "name": "Updated Hero Name",
    "updated_at": "2025-01-01T02:00:00Z"
  }
]
```

---

## 4. Prompt Submission APIs (Edge Functions)

### 4.1. 프롬프트 제출
```http
POST /functions/v1/submit-prompt
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "character_id": "uuid",
  "prompt": "불꽃을 다루는 마법사"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "prompt_history_id": "uuid",
    "round_number": 5,
    "scores": {
      "strength": 15,
      "charm": 20,
      "creativity": 25,
      "total": 60
    },
    "character": {
      "total_score": 210,
      "strength": 65,
      "charm": 70,
      "creativity": 75
    }
  }
}
```

**Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "ALREADY_SUBMITTED",
  "message": "이미 이번 라운드에 프롬프트를 제출했습니다."
}
```

**Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "INVALID_PROMPT_LENGTH",
  "message": "프롬프트는 30자 이내여야 합니다."
}
```

### 4.2. AI 점수 평가 (Internal)
이 API는 submit-prompt Edge Function 내부에서 호출되는 로직입니다.

**평가 기준**
- **Strength (힘)**: 전투력, 강함, 파워 관련 키워드 분석
- **Charm (매력)**: 아름다움, 카리스마, 친화력 관련 키워드 분석
- **Creativity (창의성)**: 독창성, 신선함, 조합의 참신함 분석

각 항목당 0-50점, 총 0-150점

---

## 5. Game Round APIs

### 5.1. 현재 라운드 정보 조회
```http
GET /rest/v1/rpc/get_current_round
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "round_number": 5,
    "start_time": "2025-01-01T05:00:00Z",
    "end_time": "2025-01-01T06:00:00Z",
    "time_remaining": "00:45:23"
  }
]
```

### 5.2. 라운드 전환 (Admin/Cron)
```http
POST /functions/v1/advance-round
Authorization: Bearer <service_role_key>
Content-Type: application/json
```

**Response (200 OK)**
```json
{
  "success": true,
  "previous_round": 5,
  "current_round": 6,
  "snapshot_created": true,
  "leaderboard_count": 150
}
```

---

## 6. Leaderboard APIs

### 6.1. 현재 리더보드 조회
```http
GET /rest/v1/rpc/get_current_leaderboard?limit_count=100
```

**Response (200 OK)**
```json
[
  {
    "rank": 1,
    "character_id": "uuid",
    "character_name": "Fire Wizard",
    "username": "player123",
    "display_name": "Player One",
    "avatar_url": "https://...",
    "total_score": 500,
    "strength": 180,
    "charm": 160,
    "creativity": 160,
    "current_prompt": "불꽃을 다루는 전설의 마법사"
  },
  {
    "rank": 2,
    "character_id": "uuid",
    "character_name": "Ice Knight",
    "username": "player456",
    "display_name": "Player Two",
    "avatar_url": "https://...",
    "total_score": 480,
    "strength": 200,
    "charm": 140,
    "creativity": 140,
    "current_prompt": "얼음 검을 휘두르는 기사"
  }
]
```

### 6.2. 특정 라운드 리더보드 조회
```http
GET /rest/v1/leaderboard_snapshots?round_number=eq.5&select=*,profiles(username,display_name,avatar_url)&order=rank.asc&limit=100
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "round_number": 5,
    "character_id": "uuid",
    "user_id": "uuid",
    "rank": 1,
    "total_score": 450,
    "strength": 170,
    "charm": 150,
    "creativity": 130,
    "created_at": "2025-01-01T06:00:00Z",
    "profiles": {
      "username": "player123",
      "display_name": "Player One",
      "avatar_url": "https://..."
    }
  }
]
```

### 6.3. 내 순위 조회
```http
POST /functions/v1/get-my-rank
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "character_id": "uuid"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "rank": 42,
    "total_participants": 500,
    "percentile": 8.4,
    "character": {
      "total_score": 280,
      "strength": 95,
      "charm": 90,
      "creativity": 95
    }
  }
}
```

---

## 7. Prompt History APIs

### 7.1. 내 프롬프트 히스토리 조회
```http
GET /rest/v1/prompt_history?character_id=eq.<character_id>&select=*&order=created_at.desc&limit=20
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
[
  {
    "id": "uuid",
    "character_id": "uuid",
    "user_id": "uuid",
    "prompt": "불꽃을 다루는 마법사",
    "round_number": 5,
    "strength_gained": 15,
    "charm_gained": 20,
    "creativity_gained": 25,
    "total_score_gained": 60,
    "created_at": "2025-01-01T05:30:00Z"
  }
]
```

---

## 8. Realtime Subscriptions (Supabase Realtime)

### 8.1. 리더보드 실시간 구독
```javascript
const subscription = supabase
  .channel('leaderboard-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'characters'
    },
    (payload) => {
      console.log('Character updated:', payload)
      // 리더보드 재조회 또는 업데이트
    }
  )
  .subscribe()
```

### 8.2. 게임 라운드 실시간 구독
```javascript
const subscription = supabase
  .channel('round-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_rounds'
    },
    (payload) => {
      console.log('Round changed:', payload)
      // 새 라운드 정보 표시
    }
  )
  .subscribe()
```

---

## Edge Functions

### 1. submit-prompt
**위치**: `supabase/functions/submit-prompt/index.ts`

**역할**:
- 프롬프트 유효성 검증 (30자 이내)
- 중복 제출 확인 (같은 라운드)
- AI 점수 평가 (외부 API 또는 내부 로직)
- prompt_history 저장
- characters 테이블 점수 업데이트

### 2. advance-round
**위치**: `supabase/functions/advance-round/index.ts`

**역할**:
- 현재 라운드 종료
- 리더보드 스냅샷 생성
- 새 라운드 생성
- Cron job으로 1시간마다 자동 실행

### 3. get-my-rank
**위치**: `supabase/functions/get-my-rank/index.ts`

**역할**:
- 현재 사용자 캐릭터의 순위 계산
- 전체 참가자 대비 백분위 계산

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_PROMPT_LENGTH | 400 | 프롬프트가 30자를 초과함 |
| ALREADY_SUBMITTED | 400 | 이미 이번 라운드에 제출함 |
| CHARACTER_NOT_FOUND | 404 | 캐릭터를 찾을 수 없음 |
| UNAUTHORIZED | 401 | 인증되지 않은 요청 |
| FORBIDDEN | 403 | 권한이 없는 요청 |
| ROUND_NOT_ACTIVE | 400 | 활성 라운드가 없음 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 횟수 제한 초과 |

---

## Rate Limiting

- 프롬프트 제출: 라운드당 1회
- 리더보드 조회: 분당 30회
- 프로필 수정: 분당 5회

---

## Cron Jobs (Supabase Edge Functions)

### 라운드 자동 전환
```bash
# 1시간마다 실행
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/advance-round \
  -H "Authorization: Bearer <service_role_key>"
```

또는 Supabase Cron 설정:
```sql
SELECT cron.schedule(
  'advance-round-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/advance-round',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  );
  $$
);
```
