# API Specification v2.0
**100% Edge Functions Architecture - No Direct DB Access from Client**

## Base URL
```
Development: http://localhost:54321/functions/v1
Production: https://oapwrpmohheorgbweeon.supabase.co/functions/v1
```

## Authentication
모든 API는 JWT 토큰 필요 (Supabase Auth)
```
Authorization: Bearer <access_token>
```

**예외:**
- Google OAuth: `supabase.auth.signInWithOAuth()` 사용 (Supabase Auth 직접)
- 로그아웃: `supabase.auth.signOut()` 사용

---

## User Edge Functions (일반 사용자)

### 1. Character APIs

#### GET /get-my-character
내 활성 캐릭터 조회

**Request:**
- Headers: `Authorization: Bearer <token>`
- Body: None

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "용사 김철수",
    "current_prompt": "불꽃을 다루는 마법사",
    "total_score": 150,
    "strength": 50,
    "charm": 45,
    "creativity": 55,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `401 UNAUTHORIZED`: 인증 필요
- `404 CHARACTER_NOT_FOUND`: 캐릭터 없음

---

#### POST /create-character
캐릭터 생성 (사용자당 1개만)

**Request:**
```json
{
  "name": "용사 김철수"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "용사 김철수",
    "current_prompt": "새로운 영웅",
    "total_score": 0,
    "strength": 0,
    "charm": 0,
    "creativity": 0
  }
}
```

**Errors:**
- `400 CHARACTER_ALREADY_EXISTS`: 이미 활성 캐릭터 존재
- `400 INVALID_CHARACTER_NAME`: 이름 형식 오류

---

#### PATCH /update-character-name
캐릭터 이름 수정

**Request:**
```json
{
  "character_id": "uuid",
  "name": "마법사 김철수"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "마법사 김철수"
  }
}
```

---

### 2. Prompt APIs

#### POST /submit-prompt
프롬프트 제출 및 시련 평가

**Request:**
```json
{
  "character_id": "uuid",
  "prompt": "불꽃을 다루는 마법사",
  "trial_id": "uuid" // (optional) 지정 시 해당 시련으로 평가, 없으면 활성 라운드의 Trial #1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt_history_id": "uuid",
    "round_number": 5,
    "trial_id": "uuid",
    "scores": {
      "strength": 12,
      "dexterity": 14,
      "constitution": 11,
      "intelligence": 18,
      "total": 55,
      "weighted_total": 110
    }
  }
}
```

**Errors:**
- `400 ALREADY_SUBMITTED`: 이미 제출함
- `400 INVALID_PROMPT_LENGTH`: 1-30자 범위 벗어남
- `400 ROUND_NOT_ACTIVE`: 활성 라운드 없음
- `429 RATE_LIMIT_EXCEEDED`: 요청 제한 초과

---

#### GET /get-my-prompts
내 프롬프트 히스토리 조회

**Query Params:**
- `limit`: 조회 개수 (default: 20, max: 100)
- `offset`: 페이지네이션 (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "prompt": "불꽃을 다루는 마법사",
      "round_number": 5,
      "strength_gained": 15,
      "charm_gained": 20,
      "creativity_gained": 25,
      "total_score_gained": 60,
      "created_at": "2025-01-15T11:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3. Trials & Plan APIs

#### GET /get-round-trials
활성 라운드의 시련 목록

Response:
```json
{
  "success": true,
  "data": {
    "round_id": "uuid",
    "trials": [
      { "id": "uuid", "trial_no": 1, "level": 1, "weight_multiplier": 1, "status": "scheduled" }
    ]
  }
}
```

#### GET /get-my-trials
내 시련 결과 조회

Response:
```json
{
  "success": true,
  "data": {
    "trials": [
      {
        "id": "uuid",
        "trial_id": "uuid",
        "round_number": 5,
        "trial_no": 2,
        "level": 2,
        "total_score": 60,
        "weighted_total": 120,
        "created_at": "2025-01-15T11:30:00Z"
      }
    ]
  }
}
```

#### GET /get-my-plan
내 캐릭터의 성장 계획 조회

#### POST /upsert-plan
성장 계획 저장 (Lv1~Lv3)
- 제약: 각 스탯 ≤ 20, Lv2=Lv1+1+1, Lv3=Lv2+1+1

---

### 4. Game Round APIs

#### GET /get-current-round
현재 활성 라운드 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "round_number": 5,
    "start_time": "2025-01-15T11:00:00Z",
    "end_time": "2025-01-15T12:00:00Z",
    "time_remaining": "00:25:30",
    "is_active": true,
    "status": "active"
  }
}
```

**Errors:**
- `404 NO_ACTIVE_ROUND`: 활성 라운드 없음

---

#### GET /get-round-info
특정 라운드 정보 조회

**Query Params:**
- `round_number`: 라운드 번호

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "round_number": 5,
    "start_time": "2025-01-15T11:00:00Z",
    "end_time": "2025-01-15T12:00:00Z",
    "actual_end_time": "2025-01-15T12:00:00Z",
    "status": "completed",
    "total_participants": 450
  }
}
```

---

### 5. Leaderboard APIs

#### GET /get-leaderboard
현재 리더보드 조회

**Query Params:**
- `limit`: 조회 개수 (default: 100, max: 1000)
- `offset`: 페이지네이션 (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "character_id": "uuid",
      "character_name": "용사 김철수",
      "display_name": "김철수",
      "avatar_url": "https://...",
      "weighted_total": 500,
      "current_prompt": "불꽃을 다루는 마법사"
    }
  ],
  "pagination": {
    "total": 1200,
    "limit": 100,
    "offset": 0
  }
}
```

---

#### GET /get-past-leaderboard
과거 라운드 리더보드 조회

**Query Params:**
- `round_number`: 라운드 번호 (required)
- `limit`: 조회 개수 (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "character_id": "uuid",
      "character_name": "용사 김철수",
      "display_name": "김철수",
      "avatar_url": "https://...",
      "total_score": 450,
      "strength": 160,
      "charm": 145,
      "creativity": 145
    }
  ]
}
```

---

#### GET /get-my-rank
내 순위 조회

**Request:**
```json
{
  "character_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 42,
    "total_participants": 1200,
    "percentile": 96.5,
    "character": {
      "total_score": 210,
      "strength": 70,
      "charm": 70,
      "creativity": 70
    }
  }
}
```

---

### 6. Profile APIs

#### GET /get-my-profile
내 프로필 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "display_name": "김철수",
    "avatar_url": "https://...",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

#### PATCH /update-profile
프로필 수정

**Request:**
```json
{
  "display_name": "마법사 김철수"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "display_name": "마법사 김철수"
  }
}
```

---

## Admin Edge Functions

### 7. Round Management

#### POST /admin-rounds-create
라운드 생성

**Request:**
```json
{
  "round_number": 6,
  "start_time": "2025-01-15T11:00:00Z",
  "end_time": "2025-01-15T12:00:00Z",
  "notes": "정규 라운드"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "round_number": 6,
    "status": "scheduled"
  }
}
```

---

#### POST /admin-rounds-start
라운드 시작

**Request:**
```json
{
  "round_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "round_number": 6,
    "status": "active",
    "started_at": "2025-01-15T11:00:00Z"
  }
}
```

---

#### POST /admin-rounds-end
라운드 종료 (스냅샷 자동 생성)

**Request:**
```json
{
  "notes": "정상 종료"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "round_number": 6,
    "status": "completed",
    "ended_at": "2025-01-15T12:00:00Z",
    "snapshot_created": true,
    "total_participants": 450
  }
}
```

---

#### POST /admin-rounds-extend
라운드 연장

**Request:**
```json
{
  "extend_minutes": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "round_number": 6,
    "new_end_time": "2025-01-15T12:30:00Z"
  }
}
```

---

#### POST /admin-rounds-cancel
라운드 취소

**Request:**
```json
{
  "round_id": "uuid",
  "reason": "기술적 문제"
}
```

---

#### GET /admin-rounds-list
라운드 목록 조회

**Query Params:**
- `status`: scheduled | active | completed | cancelled
- `limit`: 조회 개수
- `offset`: 페이지네이션

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "round_number": 6,
      "start_time": "2025-01-15T11:00:00Z",
      "end_time": "2025-01-15T12:00:00Z",
      "status": "active",
      "total_participants": 450
    }
  ]
}
```

---

### 8. Prompt Moderation

#### GET /admin-prompts-list
프롬프트 목록 조회 (필터링, 검색)

**Query Params:**
- `round_number`: 라운드 번호 (optional)
- `search`: 검색어 (optional)
- `limit`: 조회 개수
- `offset`: 페이지네이션

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "character_name": "용사 김철수",
      "user_email": "user@example.com",
      "prompt": "불꽃을 다루는 마법사",
      "round_number": 5,
      "total_score_gained": 60,
      "created_at": "2025-01-15T11:30:00Z"
    }
  ]
}
```

---

#### DELETE /admin-prompts-delete
프롬프트 삭제 (소프트 삭제 + 점수 롤백)

**Request:**
```json
{
  "prompt_id": "uuid",
  "reason": "부적절한 내용"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt_id": "uuid",
    "rollback_scores": {
      "strength": -15,
      "charm": -20,
      "creativity": -25,
      "total": -60
    },
    "new_character_total": 150
  }
}
```

---

### 9. User Management

#### GET /admin-users-list
사용자 검색/목록

**Query Params:**
- `search`: 이메일 또는 이름 검색
- `limit`: 조회 개수
- `offset`: 페이지네이션

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "display_name": "김철수",
      "email": "user@example.com",
      "avatar_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z",
      "character": {
        "name": "용사 김철수",
        "total_score": 210
      }
    }
  ]
}
```

---

#### GET /admin-users-detail
사용자 상세 정보

**Query Params:**
- `user_id`: 사용자 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "display_name": "김철수",
      "email": "user@example.com"
    },
    "character": {
      "name": "용사 김철수",
      "total_score": 210
    },
    "stats": {
      "total_prompts": 50,
      "average_score": 42,
      "best_round": 5
    }
  }
}
```

---

#### POST /admin-users-ban
사용자 제재 (캐릭터 비활성화)

**Request:**
```json
{
  "user_id": "uuid",
  "reason": "규정 위반",
  "duration_hours": 168
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "banned_until": "2025-01-22T11:00:00Z"
  }
}
```

---

#### POST /admin-users-unban
제재 해제

**Request:**
```json
{
  "user_id": "uuid"
}
```

---

### 10. Statistics

#### GET /admin-stats
전체 통계 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "total_characters": 1200,
    "total_prompts": 5400,
    "current_round": {
      "round_number": 5,
      "status": "active",
      "participants": 450,
      "time_remaining": "00:25:30"
    }
  }
}
```

---

#### GET /admin-stats-rounds
라운드별 통계

**Query Params:**
- `round_number`: 라운드 번호 (optional, 없으면 최근 10개)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "round_number": 5,
      "total_participants": 450,
      "total_prompts": 450,
      "average_score": 42,
      "highest_score": 95,
      "started_at": "2025-01-15T11:00:00Z",
      "ended_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

#### GET /admin-stats-users
사용자 통계 (참여율, 활동 분석)

**Response:**
```json
{
  "success": true,
  "data": {
    "active_users_today": 450,
    "new_users_today": 50,
    "retention_rate": 0.75,
    "average_prompts_per_user": 10.5
  }
}
```

---

### 11. Audit Log

#### GET /admin-audit-log
관리자 행동 로그 조회

**Query Params:**
- `action`: 액션 필터 (optional)
- `admin_id`: 관리자 ID 필터 (optional)
- `limit`: 조회 개수
- `offset`: 페이지네이션

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin_email": "admin@example.com",
      "action": "START_ROUND",
      "resource_type": "game_rounds",
      "resource_id": "uuid",
      "changes": {
        "status": "active"
      },
      "created_at": "2025-01-15T11:00:00Z"
    }
  ]
}
```

---

## Error Response Format

모든 Edge Functions는 동일한 에러 포맷 사용:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "사용자 친화적 에러 메시지",
  "details": {}
}
```

---

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `INVALID_REQUEST` | 400 | 잘못된 요청 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 제한 초과 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

---

## 전체 Edge Functions 목록

### User Functions
1. `get-my-character` - 내 캐릭터 조회
2. `create-character` - 캐릭터 생성
3. `update-character-name` - 캐릭터 이름 수정
4. `submit-prompt` - 프롬프트 제출/시련 평가
5. `get-round-trials` - 활성 라운드 시련 목록
6. `get-my-trials` - 내 시련 결과
7. `get-my-plan` - 플랜 조회
8. `upsert-plan` - 플랜 저장
9. `get-current-round` - 현재 라운드
10. `get-round-info` - 라운드 정보
11. `get-leaderboard` - 리더보드(가중 총합 기준)
12. `get-past-leaderboard` - 과거 리더보드
13. `get-my-rank` - 내 순위(가중 총합 기준)
14. `get-my-prompts` - 내 프롬프트 히스토리
15. `update-profile` - 프로필 수정

### Admin Functions
12. `admin-rounds-create` - 라운드 생성
13. `admin-rounds-start` - 라운드 시작
14. `admin-rounds-end` - 라운드 종료
15. `admin-rounds-extend` - 라운드 연장
16. `admin-rounds-cancel` - 라운드 취소
17. `admin-rounds-list` - 라운드 목록
18. `admin-trials-create` - 시련 생성/업서트
19. `admin-trials-update` - 시련 수정
20. `admin-trials-delete` - 시련 삭제
21. `admin-trials-list` - 라운드 시련 목록
22. `admin-prompts-list` - 프롬프트 목록
23. `admin-prompts-delete` - 프롬프트 삭제
24. `evaluate-trial` - 시련 재평가(단건, 유틸)
25. `re-evaluate-stale` - 플랜 변경 등으로 Stale 표시된 결과 일괄 재평가
26. `admin-users-list` - 사용자 목록
27. `admin-users-detail` - 사용자 상세
28. `admin-users-ban` - 사용자 제재
29. `admin-users-unban` - 제재 해제
30. `admin-stats` - 전체 통계
31. `admin-stats-rounds` - 라운드별 통계
32. `admin-stats-users` - 사용자 통계
33. `admin-audit-log` - 감사 로그

---

## Shared Utilities

모든 Edge Functions에서 공통으로 사용:

1. `_shared/cors.ts` - CORS 헤더
2. `_shared/response.ts` - 응답 포맷
3. `_shared/auth.ts` - JWT 검증
4. `_shared/admin.ts` - Admin 권한 확인
5. `_shared/db.ts` - Supabase 클라이언트 (Service Role)
6. `_shared/audit.ts` - Audit Log 생성
7. `_shared/rateLimit.ts` - Rate Limiting (Deno KV)
