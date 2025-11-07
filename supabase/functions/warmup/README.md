# Edge Functions Warmup

모든 Edge Functions의 cold start를 방지하기 위한 warmup 함수입니다.

## 배포

```bash
# warmup 함수 배포
npx supabase functions deploy warmup

# 또는 ACCESS_TOKEN 사용
SUPABASE_ACCESS_TOKEN=$VITE_SUPABASE_ACCESS_TOKEN npx supabase functions deploy warmup
```

## 사용 방법

### 1. 수동 호출

```bash
curl -X POST https://YOUR_PROJECT_URL.supabase.co/functions/v1/warmup \
  -H "Content-Type: application/json"
```

### 2. GitHub Actions (권장)

`.github/workflows/warmup-functions.yml` 파일이 이미 생성되어 있습니다.

**GitHub Secrets 설정 필요:**

Repository Settings → Secrets and variables → Actions → New repository secret

1. `SUPABASE_ACCESS_TOKEN`: `sbp_2f6f668edeca8a9fc65571845de8ab5a69cbe83c`
2. `SUPABASE_PROJECT_REF`: `oapwrpmohheorgbweeon`

**또는 더 간단하게 (권장):**

GitHub Secrets에 ANON_KEY만 저장하고 curl 사용:

```yaml
- name: Warmup Edge Functions
  run: |
    curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/warmup" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**필요한 Secrets:**
- `SUPABASE_URL`: `https://oapwrpmohheorgbweeon.supabase.co`
- `SUPABASE_ANON_KEY`: Supabase anon key

### 3. Vercel Cron Jobs

`vercel.json`에 추가:

```json
{
  "crons": [
    {
      "path": "/api/warmup",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

`pages/api/warmup.ts` 생성:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/warmup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
```

### 4. 외부 Cron 서비스

- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronhub](https://cronhub.io)

**설정:**
- URL: `https://YOUR_PROJECT_URL.supabase.co/functions/v1/warmup`
- Method: POST
- Interval: 5분마다

## 응답 예시

```json
{
  "success": true,
  "data": {
    "total": 35,
    "warmed": 35,
    "duration_ms": 2450,
    "timestamp": "2025-01-08T12:00:00.000Z",
    "details": [
      {
        "function": "admin-audit-log",
        "status": 401,
        "success": true
      },
      {
        "function": "get-current-round",
        "status": 200,
        "success": true
      }
      // ... 나머지 함수들
    ]
  }
}
```

## 작동 원리

1. 모든 Edge Functions 목록을 가지고 있음 (35개)
2. `Promise.allSettled`로 모든 함수에 빈 요청 전송
3. 각 함수는 5초 타임아웃 설정
4. 인증 실패(401) 등의 에러는 정상 - cold start만 방지하면 됨
5. 결과 요약 반환

## 주의사항

- Admin 함수들은 인증이 없으므로 401 에러가 정상입니다
- 중요한 것은 함수가 "호출"되는 것이지 "성공"하는 것이 아닙니다
- cold start는 보통 5-10분 후 발생하므로 5분마다 호출 권장
- 비용: Supabase Functions는 첫 500,000 호출까지 무료

## 비용 계산

- 1시간에 12회 (5분마다)
- 1일에 288회
- 1달에 8,640회
- 무료 한도: 500,000회/월 → 충분히 무료 범위 내
