# GameRule 변경 작업 로그

## 개요
- 룰 반영: 4스탯(STR/DEX/CON/INT), 라운드별 3 시련(가중치 1/2/4), 플랜(Lv1~Lv3), 연쇄 재평가 규칙.
- 읽기 전용은 일부 SDK 사용, 쓰기/평가/관리 로직은 Supabase Edge Functions로 일원화.

## 주요 변경 요약
- DB 스키마(마이그레이션)
  - `character_plans`(플랜), `trials`(시련), `trial_results`(시련 결과), `v_weighted_scores`(가중 합산 뷰)
  - `characters`에 4스탯 컬럼 추가: `dexterity`, `constitution`, `intelligence`
  - 플랜 변경 시 관련 시련 결과 `needs_revalidation` 표시 트리거
  - 플랜 스탯 최대 20 제약 추가(Lv1/Lv2/Lv3)
  - 백필: 기존 캐릭터에 기본 플랜 자동 생성
  - 모든 마이그레이션을 idempotent(이미 있으면 건너뜀)로 보강
- Edge Functions
  - 사용자: `submit-prompt`(trial_id 지원, 결과/가중치 반영), `get-round-trials`, `get-my-trials`, `get-my-plan`, `upsert-plan`, `get-leaderboard`(가중 합산), `get-my-rank`(가중 합산)
  - 관리자: `admin-trials-{create,update,delete,list}`, `evaluate-trial`, `re-evaluate-stale`
- Frontend
  - 프로필: 플랜 편집 UI(`PlanEditor`) 추가
  - 제출 UI: 시련 선택 Select 추가
  - 히스토리: 시련별 결과(원점수/가중 총점) 섹션 추가
  - 리얼타임: `trial_results` 변경에도 리더보드 무효화
- 문서
  - `docs/DB_DESIGN.md`, `docs/API_SPEC.md` 업데이트
  - `docs/DEPLOYMENT.md` 배포/트러블슈팅 갱신
  - `docs/MIGRATION_GUIDE.md` 신규 작성

## 실행(배포) 관련 메모
- 마이그레이션
  - supabase 링크 및 `supabase db push` 적용 완료
  - idempotent 처리로 기존 스키마가 있어도 안전하게 재실행 가능
- Edge Functions 배포
  - 한 차례 배포 실행 도중 취소됨. 재실행 필요
  - TLS UnknownIssuer 환경 이슈 대응: `DENO_TLS_CA_STORE=system` 설정 (배포 스크립트 반영)
- vendor(선택)
  - `deno vendor`로 의존성 고정(네트워크 의존↓) 작업은 보류(DEPLOY-2). 필요 시 진행 권장

## 남은 작업(요약)
- 배포: Edge Functions 재배포 실행(취소 지점 이후 재시도)
- 배포 안정화(선택): `deno vendor` 적용 및 상대 import 전환(DEPLOY-2)
- 환경 특이점 문서화 심화(DEPLOY-3)
- QA 체크리스트(룰 검증/엣지 케이스) 작성(QA-1)

## 재실행 가이드
- .env 점검
  - 공백 포함 값은 반드시 "따옴표" 사용
  - 필수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`
  - 점검 스크립트: `./scripts/check-env.sh`
- 마이그레이션
  ```bash
  npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
  SUPABASE_ACCESS_TOKEN="$VITE_SUPABASE_ACCESS_TOKEN" npx supabase db push
  ```
- Edge Functions 배포
  ```bash
  # TLS 신뢰 저장소 사용, --debug 로깅 추가됨
  bash ./scripts/deploy-edge-functions.sh
  ```
- 전체 배포(프론트 포함)
  ```bash
  bash ./scripts/deploy.sh
  ```

## 참고 링크
- 배포: `docs/DEPLOYMENT.md`
- API: `docs/API_SPEC.md`
- DB: `docs/DB_DESIGN.md`, `docs/MIGRATION_GUIDE.md`

