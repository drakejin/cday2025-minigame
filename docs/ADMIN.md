# Admin System Design

## Overview
캐릭터 육성 이벤트 게임의 Admin 관리 시스템 설계 문서입니다.
Admin이 수동으로 게임 라운드를 관리하고, 사용자를 모니터링하며, 부적절한 콘텐츠를 제재할 수 있습니다.

---

## Admin 권한 구조

### 권한 레벨

```
super_admin (최고 관리자)
  ├── Admin 계정 생성/삭제
  ├── 라운드 관리 (생성/시작/종료/취소)
  ├── 사용자 관리 (제재/해제)
  ├── 콘텐츠 관리 (프롬프트 삭제)
  ├── 통계 조회
  └── Audit Log 조회

admin (일반 관리자)
  ├── 라운드 관리 (시작/종료)
  ├── 사용자 관리 (제재/해제)
  ├── 콘텐츠 관리 (프롬프트 삭제)
  └── 통계 조회

moderator (중재자)
  ├── 콘텐츠 관리 (프롬프트 삭제)
  └── 통계 조회
```

### Permissions JSONB 구조

```json
{
  "rounds": true,       // 라운드 관리 권한
  "users": true,        // 사용자 관리 권한
  "stats": true,        // 통계 조회 권한
  "prompts": true,      // 프롬프트 삭제 권한
  "admin_manage": true  // Admin 계정 관리 (super_admin만)
}
```

---

## Admin 인증 흐름

### 1. Admin 로그인

```
User Login (Supabase Auth)
         ↓
Check admin_users table
         ↓
      Yes → Admin JWT 발급 (role, permissions 포함)
       ↓
Admin Dashboard
```

### 2. Admin JWT 토큰 구조

```json
{
  "sub": "user-uuid",
  "email": "admin@example.com",
  "role": "admin",
  "admin_id": "admin-user-uuid",
  "permissions": {
    "rounds": true,
    "users": true,
    "stats": true,
    "prompts": true
  },
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 3. Admin 권한 확인 (Edge Functions)

**모든 Admin Edge Functions에서 공통으로 사용하는 패턴:**

```typescript
// adminAuth.ts (유틸리티 함수)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyAdmin(req: Request, requiredPermission?: string) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { error: 'No token provided', status: 401, admin: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // JWT 검증
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { error: 'Invalid token', status: 401, admin: null, supabase }
  }

  // Admin 확인
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError || !admin) {
    return { error: 'Admin permission required', status: 403, admin: null, supabase }
  }

  // 특정 권한 확인
  if (requiredPermission && !admin.permissions[requiredPermission]) {
    return {
      error: `No ${requiredPermission} permission`,
      status: 403,
      admin: null,
      supabase
    }
  }

  return { error: null, status: 200, admin, supabase }
}
```

**사용 예시:**
```typescript
// supabase/functions/admin-rounds-start/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { verifyAdmin } from "../_shared/adminAuth.ts"

serve(async (req) => {
  // Admin 권한 확인
  const { error, status, admin, supabase } = await verifyAdmin(req, 'rounds')

  if (error) {
    return new Response(JSON.stringify({ error }), { status })
  }

  // 비즈니스 로직 계속...
})
```

---

## Admin API Endpoints

### 1. 라운드 관리

#### POST /functions/v1/admin-rounds-create
새 라운드 생성 (예약)

```typescript
Request:
{
  "round_number": 5,
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T10:00:00Z"
}

Response:
{
  "success": true,
  "round": {
    "id": "uuid",
    "round_number": 5,
    "status": "scheduled",
    "start_time": "2025-01-15T09:00:00Z",
    "end_time": "2025-01-15T10:00:00Z"
  }
}
```

#### POST /functions/v1/admin-rounds-start
라운드 시작

```typescript
Request:
{
  "round_id": "uuid"
}

Response:
{
  "success": true,
  "round": {
    "id": "uuid",
    "status": "active",
    "is_active": true,
    "started_by": "admin-uuid"
  }
}
```

#### POST /functions/v1/admin-rounds-end
라운드 종료

```typescript
Request:
{
  "round_id": "uuid",
  "notes": "정상 종료"
}

Response:
{
  "success": true,
  "round": {
    "id": "uuid",
    "status": "completed",
    "is_active": false,
    "actual_end_time": "2025-01-15T10:05:00Z",
    "ended_by": "admin-uuid"
  }
}
```

#### POST /functions/v1/admin-rounds-extend
라운드 연장

```typescript
Request:
{
  "round_id": "uuid",
  "extend_minutes": 30
}

Response:
{
  "success": true,
  "round": {
    "id": "uuid",
    "end_time": "2025-01-15T10:30:00Z"
  }
}
```

#### POST /functions/v1/admin-rounds-cancel
라운드 취소

```typescript
Request:
{
  "round_id": "uuid",
  "reason": "서버 점검"
}

Response:
{
  "success": true
}
```

---

### 2. 통계 조회

#### GET /functions/v1/admin-stats
전체 통계

```typescript
Response:
{
  "totalUsers": 1500,
  "totalCharacters": 1200,
  "activeCharacters": 1150,
  "totalPrompts": 5400,
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
```

#### GET /api/admin/stats/rounds
라운드별 통계

```typescript
Response:
{
  "rounds": [
    {
      "round_number": 5,
      "status": "active",
      "totalSubmissions": 450,
      "avgScore": 25.5,
      "topScore": 85,
      "duration": "1h"
    },
    {
      "round_number": 4,
      "status": "completed",
      "totalSubmissions": 480,
      "avgScore": 24.2,
      "topScore": 82,
      "duration": "1h 5m"
    }
  ]
}
```

#### GET /api/admin/stats/users
사용자 통계

```typescript
Response:
{
  "totalUsers": 1500,
  "activeUsers": 850,
  "newUsersToday": 45,
  "topUsers": [
    {
      "username": "player1",
      "total_score": 520,
      "participation_rate": 0.95
    }
  ]
}
```

---

### 3. 프롬프트 관리

#### GET /api/admin/prompts?round=5&page=1
프롬프트 목록 조회

```typescript
Response:
{
  "prompts": [
    {
      "id": "uuid",
      "user_id": "user-uuid",
      "username": "player1",
      "prompt": "나는 최강의 전사",
      "round_number": 5,
      "strength_gained": 8,
      "charm_gained": 5,
      "creativity_gained": 7,
      "is_deleted": false,
      "created_at": "2025-01-15T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 450
  }
}
```

#### DELETE /api/admin/prompts/:id
부적절한 프롬프트 삭제 (소프트 삭제)

```typescript
Request:
{
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

Implementation:
1. prompt_history.is_deleted = true
2. prompt_history.deleted_by = admin_id
3. prompt_history.delete_reason = reason
4. characters 테이블에서 점수 롤백
5. admin_audit_log 기록
```

---

### 4. 사용자 관리

#### GET /api/admin/users?search=player1&page=1
사용자 검색

```typescript
Response:
{
  "users": [
    {
      "id": "uuid",
      "username": "player1",
      "email": "player1@example.com",
      "created_at": "2025-01-01T00:00:00Z",
      "character": {
        "name": "전사",
        "total_score": 520,
        "is_active": true
      },
      "stats": {
        "totalSubmissions": 18,
        "participationRate": 0.9
      }
    }
  ]
}
```

#### PATCH /api/admin/users/:id/ban
사용자 제재 (캐릭터 비활성화)

```typescript
Request:
{
  "reason": "규정 위반",
  "duration": "7d" // "permanent", "7d", "1d" 등
}

Response:
{
  "success": true
}

Implementation:
1. characters.is_active = false
2. admin_audit_log 기록
```

#### PATCH /api/admin/users/:id/unban
사용자 제재 해제

```typescript
Response:
{
  "success": true
}
```

---

### 5. Audit Log

#### GET /api/admin/audit-log?page=1&action=START_ROUND
Admin 행동 로그 조회

```typescript
Response:
{
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
      "created_at": "2025-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234
  }
}
```

---

## Admin Panel UI

### Dashboard (메인 화면)

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard                    [Logout]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Current Round: #5 (Active)                    │
│  ├─ Started: 09:00 AM                          │
│  ├─ Ends: 10:00 AM (55 min left)              │
│  ├─ Participants: 450/1200                     │
│  └─ [End Round Now]  [Extend +30min]          │
│                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │  Users    │ │  Prompts  │ │  Rounds   │   │
│  │  1,500    │ │  5,400    │ │  24       │   │
│  └───────────┘ └───────────┘ └───────────┘   │
│                                                 │
│  Recent Activity                                │
│  • 10:45 - 새 사용자 등록: player123           │
│  • 10:42 - 프롬프트 제출: player456            │
│  • 10:40 - Admin2가 부적절한 프롬프트 삭제      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Round Management 화면

```
┌─────────────────────────────────────────────────┐
│  Round Management                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+ Create New Round]                           │
│                                                 │
│  Upcoming Rounds                                │
│  ┌───────────────────────────────────────────┐ │
│  │ Round #6 - Scheduled                      │ │
│  │ Start: 11:00 AM - End: 12:00 PM          │ │
│  │ [Start Now] [Edit] [Cancel]               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Active Round                                   │
│  ┌───────────────────────────────────────────┐ │
│  │ Round #5 - Active                         │ │
│  │ Started: 10:00 AM by admin1               │ │
│  │ Ends: 11:00 AM (45 min left)              │ │
│  │ Participants: 650/1200                    │ │
│  │ [End Now] [Extend]                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Past Rounds                                    │
│  [View History]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Prompts Moderation 화면

```
┌─────────────────────────────────────────────────┐
│  Prompt Moderation                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Filters: [Round: All ▼] [Sort: Recent ▼]      │
│           [Search user...]                      │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ @player1 • Round #5 • 10:15 AM            │ │
│  │ "나는 최강의 전사"                         │ │
│  │ Str: 8 | Cha: 5 | Cre: 7 | Total: 20      │ │
│  │ [Delete]                                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ @player2 • Round #5 • 10:12 AM            │ │
│  │ "부적절한 내용..."                         │ │
│  │ Str: 3 | Cha: 2 | Cre: 1 | Total: 6       │ │
│  │ [Delete] ← Click                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Load More]                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Implementation Phases (Edge Functions)

### Phase 1: Admin 기본 구조
- [ ] admin_users 테이블 마이그레이션
- [ ] Admin 권한 확인 유틸리티 함수 (verifyAdmin)
- [ ] `supabase/functions/_shared/adminAuth.ts` 생성

### Phase 2: 라운드 관리 Edge Functions
- [ ] `supabase/functions/admin-rounds-create/index.ts`
- [ ] `supabase/functions/admin-rounds-start/index.ts`
- [ ] `supabase/functions/admin-rounds-end/index.ts`
- [ ] `supabase/functions/admin-rounds-extend/index.ts`
- [ ] `supabase/functions/admin-rounds-cancel/index.ts`

### Phase 3: 통계 Edge Functions
- [ ] `supabase/functions/admin-stats/index.ts`
- [ ] `supabase/functions/admin-stats-rounds/index.ts`
- [ ] `supabase/functions/admin-stats-users/index.ts`

### Phase 4: 프롬프트 관리 Edge Functions
- [ ] `supabase/functions/admin-prompts/index.ts` (목록 조회)
- [ ] `supabase/functions/admin-prompts-delete/index.ts` (소프트 삭제)
- [ ] 점수 롤백 로직

### Phase 5: 사용자 관리 Edge Functions
- [ ] `supabase/functions/admin-users/index.ts` (검색)
- [ ] `supabase/functions/admin-users-ban/index.ts`
- [ ] `supabase/functions/admin-users-unban/index.ts`

### Phase 6: Audit Log Edge Function
- [ ] `supabase/functions/admin-audit-log/index.ts`
- [ ] 모든 Admin 행동에 로그 추가

### Phase 7: Edge Functions 배포
- [ ] `supabase functions deploy admin-rounds-start` 등
- [ ] Supabase Secrets 설정 (AI API 키 등)

### Phase 7: Admin Panel UI
- [ ] Admin 로그인 페이지
- [ ] Dashboard
- [ ] Round Management 페이지
- [ ] Prompt Moderation 페이지
- [ ] User Management 페이지
- [ ] Statistics 페이지
- [ ] Audit Log 페이지

---

## Security Considerations

### 1. Admin 계정 생성
- super_admin만 새 Admin 계정 생성 가능
- 초기 super_admin은 DB에 직접 INSERT
- 이메일 인증 필수

### 2. Admin JWT 토큰
- 짧은 만료 시간 (1시간)
- Refresh token 사용
- HTTPS only

### 3. Audit Log
- 모든 Admin 행동 기록
- IP 주소, User-Agent 저장
- 변경 전/후 데이터 저장

### 4. Rate Limiting
- Admin API도 Rate Limit 적용
- 특히 삭제/제재 API는 엄격하게

### 5. 2FA (Optional)
- Admin 계정은 2단계 인증 권장
- TOTP (Time-based One-Time Password)

---

## Database Seed for Testing

```sql
-- 테스트용 Admin 계정 생성
-- 1. Supabase Auth에서 사용자 생성
-- 2. profiles 자동 생성 (trigger)
-- 3. admin_users 수동 추가

INSERT INTO admin_users (id, profile_id, role, permissions)
VALUES (
  'auth-user-uuid',
  'profile-uuid',
  'super_admin',
  '{"rounds": true, "users": true, "stats": true, "prompts": true, "admin_manage": true}'
);
```

---

## Monitoring & Alerts

### 알림이 필요한 이벤트
1. 라운드 시작 실패
2. 프롬프트 대량 삭제 (1시간에 10개 이상)
3. 사용자 대량 제재 (1시간에 5명 이상)
4. Admin 계정 로그인 실패 (5회 연속)

### 로그 보관 정책
- admin_audit_log: 1년
- 삭제된 프롬프트: 영구 보관 (소프트 삭제)
- 제재된 사용자: 영구 보관

---

## FAQ

**Q: 라운드를 자동으로 시작할 수 없나요?**
A: Admin이 수동으로 시작해야 합니다. 이는 서버 상태, 사용자 접속 상황을 확인한 후 진행하기 위함입니다.

**Q: 라운드를 중간에 연장할 수 있나요?**
A: 네, Admin이 `PATCH /api/admin/rounds/:id/extend`로 연장 가능합니다.

**Q: 프롬프트를 삭제하면 점수도 자동으로 롤백되나요?**
A: 네, 프롬프트 삭제 시 characters 테이블의 점수도 자동으로 차감됩니다.

**Q: Admin이 실수로 라운드를 조기 종료하면?**
A: Audit Log에 기록되므로 추적 가능하며, 필요시 수동으로 복구해야 합니다.

**Q: Admin 계정은 몇 개까지 만들 수 있나요?**
A: 제한 없지만, super_admin은 최소 2명 이상 권장합니다.
