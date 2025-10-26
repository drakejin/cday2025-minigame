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

## 8. Admin APIs (Edge Functions)

**인증**: Supabase Auth JWT 토큰 필요
```
Authorization: Bearer <access_token>
```

Admin 여부는 Edge Function 내부에서 `admin_users` 테이블 조회로 확인합니다.

**Base URL**: `/functions/v1/*`

### 8.1. Admin 확인
Admin API를 호출할 때, Edge Function은 다음과 같이 Admin 권한을 확인합니다:

```typescript
// Edge Function 내부
const { data: admin } = await supabase
  .from('admin_users')
  .select('*')
  .eq('id', user.id)
  .eq('is_active', true)
  .single()

if (!admin || !admin.permissions.rounds) {
  return new Response(JSON.stringify({ error: 'Admin permission required' }), { status: 403 })
}
```

---

### 8.2. 라운드 관리

#### 8.2.1. 라운드 생성
```http
POST /functions/v1/admin-rounds-create
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "round_number": 6,
  "start_time": "2025-01-15T11:00:00Z",
  "end_time": "2025-01-15T12:00:00Z"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "round": {
    "id": "uuid",
    "round_number": 6,
    "status": "scheduled",
    "start_time": "2025-01-15T11:00:00Z",
    "end_time": "2025-01-15T12:00:00Z",
    "is_active": false,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

#### 8.2.2. 라운드 시작
```http
POST /functions/v1/admin-rounds-start
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "round_id": "uuid"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "round": {
    "id": "uuid",
    "round_number": 6,
    "status": "active",
    "is_active": true,
    "started_by": "admin-uuid"
  }
}
```

**Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "ALREADY_ACTIVE",
  "message": "이미 활성화된 라운드가 있습니다."
}
```

#### 8.2.3. 라운드 종료
```http
POST /functions/v1/admin-rounds-end
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "notes": "정상 종료"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "round": {
    "id": "uuid",
    "status": "completed",
    "is_active": false,
    "actual_end_time": "2025-01-15T12:05:00Z",
    "ended_by": "admin-uuid",
    "notes": "정상 종료"
  },
  "snapshot_created": true,
  "leaderboard_count": 650
}
```

#### 8.2.4. 라운드 연장
```http
POST /functions/v1/admin-rounds-extend
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "round_id": "uuid",
  "extend_minutes": 30
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "round": {
    "id": "uuid",
    "end_time": "2025-01-15T12:30:00Z"
  }
}
```

#### 8.2.5. 라운드 취소
```http
POST /functions/v1/admin-rounds-cancel
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "reason": "서버 점검"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "round": {
    "id": "uuid",
    "status": "cancelled",
    "notes": "서버 점검"
  }
}
```

---

### 8.3. 통계 조회

#### 8.3.1. 전체 통계
```http
GET /functions/v1/admin-stats
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalCharacters": 1200,
    "activeCharacters": 1150,
    "totalPrompts": 5400,
    "totalRounds": 24,
    "currentRound": {
      "round_number": 5,
      "status": "active",
      "participants": 450,
      "submissionRate": 0.75
    },
    "recentActivity": {
      "last1Hour": 120,
      "last24Hours": 890
    }
  }
}
```

#### 8.3.2. 라운드별 통계
```http
GET /functions/v1/admin-stats-rounds?limit=10
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "rounds": [
      {
        "round_number": 5,
        "status": "active",
        "totalSubmissions": 450,
        "avgScore": 25.5,
        "topScore": 85,
        "duration": "1h",
        "started_at": "2025-01-15T11:00:00Z"
      },
      {
        "round_number": 4,
        "status": "completed",
        "totalSubmissions": 480,
        "avgScore": 24.2,
        "topScore": 82,
        "duration": "1h 5m",
        "started_at": "2025-01-15T10:00:00Z",
        "ended_at": "2025-01-15T11:05:00Z"
      }
    ]
  }
}
```

#### 8.3.3. 사용자 통계
```http
GET /functions/v1/admin-stats-users
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "activeUsers": 850,
    "newUsersToday": 45,
    "newUsersWeek": 320,
    "topUsers": [
      {
        "username": "player1",
        "display_name": "Player One",
        "total_score": 520,
        "participation_rate": 0.95,
        "total_submissions": 23
      }
    ]
  }
}
```

---

### 8.4. 프롬프트 관리

#### 8.4.1. 프롬프트 목록 조회
```http
GET /functions/v1/admin-prompts?round=5&page=1&limit=50&sort=recent
Authorization: Bearer <access_token>
```

**Query Parameters**
- `round`: 라운드 번호 (optional)
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 50)
- `sort`: `recent` | `score_desc` | `score_asc`
- `search`: 사용자명 검색 (optional)

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "username": "player1",
        "display_name": "Player One",
        "character_name": "Fire Wizard",
        "prompt": "불꽃을 다루는 마법사",
        "round_number": 5,
        "strength_gained": 8,
        "charm_gained": 5,
        "creativity_gained": 7,
        "total_score_gained": 20,
        "is_deleted": false,
        "created_at": "2025-01-15T11:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 450,
      "totalPages": 9
    }
  }
}
```

#### 8.4.2. 프롬프트 삭제 (소프트 삭제)
```http
POST /functions/v1/admin-prompts-delete
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "prompt_id": "uuid",
  "reason": "부적절한 언어 사용"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "prompt_id": "uuid",
    "is_deleted": true,
    "deleted_by": "admin-uuid",
    "rollbackScore": {
      "strength": -8,
      "charm": -5,
      "creativity": -7,
      "total": -20
    }
  }
}
```

---

### 8.5. 사용자 관리

#### 8.5.1. 사용자 검색
```http
GET /functions/v1/admin-users?search=player1&page=1&limit=50
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "player1",
        "email": "player1@example.com",
        "display_name": "Player One",
        "created_at": "2025-01-01T00:00:00Z",
        "character": {
          "id": "uuid",
          "name": "Fire Wizard",
          "total_score": 520,
          "is_active": true
        },
        "stats": {
          "totalSubmissions": 18,
          "participationRate": 0.9,
          "lastActive": "2025-01-15T11:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1
    }
  }
}
```

#### 8.5.2. 사용자 제재 (캐릭터 비활성화)
```http
POST /functions/v1/admin-users-ban
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "user_id": "uuid",
  "reason": "규정 위반",
  "duration": "7d"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "character_id": "uuid",
    "is_active": false,
    "ban_reason": "규정 위반",
    "ban_until": "2025-01-22T11:00:00Z"
  }
}
```

#### 8.5.3. 사용자 제재 해제
```http
POST /functions/v1/admin-users-unban
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**
```json
{
  "user_id": "uuid"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "character_id": "uuid",
    "is_active": true,
    "unbanned_at": "2025-01-15T12:00:00Z"
  }
}
```

---

### 8.6. Audit Log 조회

```http
GET /functions/v1/admin-audit-log?page=1&limit=50&action=START_ROUND&admin_id=uuid
Authorization: Bearer <access_token>
```

**Query Parameters**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 50)
- `action`: 필터링할 액션 (optional)
- `admin_id`: 특정 Admin의 로그만 조회 (optional)

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "admin_id": "admin-uuid",
        "admin_username": "admin1",
        "action": "START_ROUND",
        "resource_type": "game_rounds",
        "resource_id": "round-uuid",
        "changes": {
          "status": "scheduled -> active"
        },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-01-15T11:00:00Z"
      },
      {
        "id": "uuid",
        "admin_id": "admin-uuid",
        "admin_username": "admin1",
        "action": "DELETE_PROMPT",
        "resource_type": "prompt_history",
        "resource_id": "prompt-uuid",
        "changes": {
          "is_deleted": "false -> true",
          "reason": "부적절한 언어 사용"
        },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-01-15T11:10:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "totalPages": 5
    }
  }
}
```

---

## 9. Realtime Subscriptions (Supabase Realtime)

### 9.1. 리더보드 실시간 구독
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

### 9.2. 게임 라운드 실시간 구독
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

## 10. Edge Functions

### 10.1. submit-prompt
**위치**: `supabase/functions/submit-prompt/index.ts`

**역할**:
- 프롬프트 유효성 검증 (30자 이내)
- 중복 제출 확인 (같은 라운드)
- AI 점수 평가 (외부 API 또는 내부 로직)
- prompt_history 저장
- characters 테이블 점수 업데이트

### 10.2. get-my-rank
**위치**: `supabase/functions/get-my-rank/index.ts`

**역할**:
- 현재 사용자 캐릭터의 순위 계산
- 전체 참가자 대비 백분위 계산

---

## 11. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_PROMPT_LENGTH | 400 | 프롬프트가 30자를 초과함 |
| ALREADY_SUBMITTED | 400 | 이미 이번 라운드에 제출함 |
| CHARACTER_NOT_FOUND | 404 | 캐릭터를 찾을 수 없음 |
| UNAUTHORIZED | 401 | 인증되지 않은 요청 |
| FORBIDDEN | 403 | 권한이 없는 요청 |
| ADMIN_FORBIDDEN | 403 | Admin 권한 없음 |
| ROUND_NOT_ACTIVE | 400 | 활성 라운드가 없음 |
| ROUND_ALREADY_ACTIVE | 400 | 이미 활성 라운드가 존재함 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 횟수 제한 초과 |

---

## 12. Rate Limiting

### User APIs
- 프롬프트 제출: 라운드당 1회
- 리더보드 조회: 분당 30회
- 프로필 수정: 분당 5회

### Admin APIs
- 라운드 관리: 분당 10회
- 프롬프트 삭제: 시간당 50회
- 사용자 제재: 시간당 20회
- 통계 조회: 분당 20회

---

## 13. Admin vs User API 구분

### User API
- **읽기**: `/rest/v1/*` (Client SDK 직접 접근, anon key)
- **쓰기**: `/functions/v1/submit-prompt`, `/functions/v1/get-my-rank` (Edge Functions)

### Admin API
- **모든 작업**: `/functions/v1/admin-*` (Edge Functions)
- 예: `/functions/v1/admin-rounds-start`, `/functions/v1/admin-stats`

### Authentication
- **User & Admin 모두**: Supabase Auth JWT (동일한 토큰)
- **Admin 확인**: Edge Function 내부에서 `admin_users` 테이블 조회

---

## 14. 라운드 관리 방식 변경

**이전 (Cron Job 자동):**
- ❌ Cron job으로 1시간마다 자동 라운드 전환
- ❌ advance-round Edge Function

**현재 (Admin 수동):**
- ✅ Admin이 수동으로 라운드 생성/시작/종료
- ✅ 특정 시간대에만 진행 (예: 09:00~23:00)
- ✅ 유연한 라운드 연장/취소 가능
- ✅ 모든 Admin 행동 Audit Log에 기록
