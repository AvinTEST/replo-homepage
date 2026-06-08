# Replo Homepage 프로젝트 맥락

> 최종 코드 분석 기준일: 2026-06-07
>
> 분석 대상: `replo-homepage-updated.zip`에서 전개한 현재 저장소 소스

## 1. 프로젝트 목적

Replo 고객용 홈페이지 MVP를 구축하는 프로젝트입니다. 고객은 Supabase 이메일 매직 링크로 로그인하고, 자신의 회사와 구독 플랜, 다음 결제일, 등록된 결제수단 상태를 대시보드에서 확인할 수 있습니다. 결제수단 변경은 카드 정보를 Replo가 직접 수집하지 않고 StepPay가 제공하는 외부 페이지로 이동하는 흐름을 목표로 합니다.

## 2. 현재 구현 현황

### 구현됨

- Next.js App Router 기반 프로젝트와 Tailwind CSS 기본 설정
- 홈 화면 및 로그인 화면
- Supabase 이메일 OTP(매직 링크) 로그인 요청
- 인증 콜백에서 인증 코드를 세션으로 교환한 후 대시보드로 이동
- 비로그인 사용자의 대시보드 접근 차단
- 로그인 사용자와 연결된 고객, 구독, 결제수단 조회
- 플랜명, 월 이용료, 포함 문의량, 다음 결제일, 마스킹된 결제수단 및 상태 표시
- 결제수단 변경 요청 화면과 서버 API 호출
- 서버 API에서 사용자, 고객, 구독을 확인하고 `billing_events`에 요청 이벤트 기록
- StepPay 서버 API 호출을 위한 토큰 및 기본 URL 환경변수 골격

### 부분 구현 또는 미완성

- StepPay 호출 경로는 현재 다음 형태로 가정되어 있으며 실제 API 명세 검증이 필요합니다.

  ```text
  POST {STEPPAY_API_BASE_URL}/{steppay_subscription_id}/payment-method
  Authorization: Bearer {STEPPAY_SECRET_TOKEN}
  ```

- StepPay 요청 본문은 비어 있고, 응답에서 `redirectUrl` 필드가 온다고 가정합니다.
- StepPay 고객 ID는 현재 조회하거나 전송하지 않습니다.
- StepPay 요청 성공/실패 후 `billing_events` 상태를 갱신하지 않습니다.
- 외부 결제 페이지에서 돌아오는 성공/실패 콜백 및 webhook 처리가 없습니다.
- 결제수단 변경 완료 후 `payment_methods`를 동기화하는 로직이 없습니다.
- Supabase 조회 및 이벤트 insert의 데이터베이스 오류를 세부적으로 처리하지 않습니다.
- 인증 콜백의 `exchangeCodeForSession` 실패 처리가 없습니다.
- 로그아웃 기능, 공통 내비게이션, 로딩/에러 UI가 없습니다.
- 테스트, 린트 스크립트, CI 설정이 없습니다.

## 3. 화면 및 API 흐름

### 로그인

1. 사용자가 `/login`에서 이메일을 입력합니다.
2. 브라우저 Supabase 클라이언트가 `signInWithOtp`를 호출합니다.
3. 이메일 링크는 `{NEXT_PUBLIC_SITE_URL}/auth/callback`으로 돌아옵니다.
4. `/auth/callback`이 URL의 `code`를 Supabase 세션으로 교환합니다.
5. 사용자를 `/dashboard`로 이동시킵니다.

### 대시보드

1. 서버 Supabase 클라이언트로 현재 사용자를 확인합니다.
2. 사용자가 없으면 `/login`으로 이동합니다.
3. `customers.user_id = auth user id` 조건으로 고객을 조회합니다.
4. 고객 ID로 `subscriptions`와 `payment_methods`를 각각 조회합니다.
5. 회사명, 플랜 및 결제 정보를 렌더링합니다.

### 결제수단 변경

1. 사용자가 `/billing/payment-method`에서 변경 버튼을 누릅니다.
2. 클라이언트가 `POST /api/billing/change-payment-method`를 호출합니다.
3. API가 로그인 사용자, 고객, 구독을 차례로 확인합니다.
4. `billing_events`에 `payment_method_change_requested` 이벤트를 추가합니다.
5. 서버에서 StepPay API를 호출합니다.
6. 성공 응답의 `redirectUrl`로 브라우저를 이동시킵니다.

## 4. 코드에서 추론한 Supabase 데이터 모델

저장소에는 SQL migration이나 타입 정의가 포함되어 있지 않습니다. 아래 구조는 현재 쿼리와 화면에서 사용하는 필드를 바탕으로 추론한 최소 요구사항입니다. 실제 Supabase 스키마, 제약조건, 인덱스 및 RLS 정책은 별도로 확인해야 합니다.

### `customers`

| 필드 | 용도 |
| --- | --- |
| `id` | 고객 레코드 식별자 |
| `user_id` | Supabase Auth 사용자와 연결 |
| `company_name` | 대시보드에 표시할 회사명 |

현재 코드는 사용자당 고객 레코드가 정확히 하나라고 가정합니다.

### `subscriptions`

| 필드 | 용도 |
| --- | --- |
| `id` | 구독 레코드 식별자 |
| `customer_id` | `customers.id` 참조 |
| `steppay_subscription_id` | StepPay 구독 식별자 |
| `plan_name` | 플랜명 |
| `monthly_fee` | 월 이용료 숫자 값 |
| `included_tickets` | 월 포함 문의량 숫자 값 |
| `next_billing_date` | 다음 결제일 |

현재 코드는 고객당 구독 레코드가 정확히 하나라고 가정합니다.

### `payment_methods`

| 필드 | 용도 |
| --- | --- |
| `customer_id` | `customers.id` 참조 |
| `masked_number` | 화면에 표시할 마스킹된 결제수단 번호 |
| `status` | 결제수단 상태 |

현재 코드는 고객당 결제수단이 없거나 하나라고 가정합니다.

### `billing_events`

| 필드 | 현재 기록 값 또는 용도 |
| --- | --- |
| `customer_id` | 요청 고객 |
| `subscription_id` | 대상 구독 |
| `event_type` | `payment_method_change_requested` |
| `status` | `requested` |
| `message` | 사용자/운영자용 이벤트 설명 |

운영 추적을 위해 `id`, `created_at`, 외부 요청 ID, 실패 코드, 완료 시각 등의 필드를 추가하는 방안을 검토해야 합니다.

## 5. RLS 및 권한 가정

서버 코드도 public anon key와 사용자 세션을 사용하므로 테이블 접근은 Supabase RLS 정책의 영향을 받습니다. 현재 운영 필수 환경변수에는 Supabase service role key를 포함하지 않습니다.

최소한 다음 정책이 실제 Supabase 프로젝트에 존재하는지 확인해야 합니다.

- 인증 사용자는 자신의 `user_id`와 연결된 `customers`만 조회할 수 있음
- 인증 사용자는 자신의 고객 ID에 속한 `subscriptions`만 조회할 수 있음
- 인증 사용자는 자신의 고객 ID에 속한 `payment_methods`만 조회할 수 있음
- 인증 사용자는 자신의 고객/구독에 대한 허용된 `billing_events`만 생성할 수 있음
- 브라우저에서 임의의 고객 ID로 다른 고객 데이터에 접근하거나 이벤트를 생성할 수 없음

RLS SQL이 저장소에 없기 때문에 현재 정책의 존재 여부와 정확성은 이 코드만으로 확인할 수 없습니다. 향후 migration 파일로 스키마와 정책을 버전 관리하는 것이 좋습니다.

## 6. 환경변수

| 변수 | 공개 여부 | 현재 사용처 | 설명 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 공개 가능 | 브라우저/서버 Supabase 클라이언트 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 공개 가능 | 브라우저/서버 Supabase 클라이언트 | Supabase anon key; RLS 필수 |
| `NEXT_PUBLIC_SITE_URL` | 브라우저 공개 가능 | 로그인 화면 | 인증 콜백 절대 URL 생성 |
| `STEPPAY_SECRET_TOKEN` | 비밀 | 결제수단 변경 API | StepPay 문서 확정 전까지 운영 미설정 권장 |
| `STEPPAY_API_BASE_URL` | 서버 설정 | 결제수단 변경 API | StepPay 문서 확정 전까지 운영 미설정 권장 |

로컬 값은 `.env.local`에 저장하고 Git에 커밋하지 않습니다. 운영 환경에서는 배포 플랫폼의 secret/environment 설정을 사용해야 합니다.

## 7. 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/app/page.tsx` | 홈 화면 |
| `src/app/login/page.tsx` | 이메일 매직 링크 로그인 |
| `src/app/auth/callback/route.ts` | Supabase 인증 콜백 |
| `src/app/dashboard/page.tsx` | 고객 구독 및 결제 정보 대시보드 |
| `src/app/billing/payment-method/page.tsx` | 결제수단 변경 시작 UI |
| `src/app/api/billing/change-payment-method/route.ts` | 인증 확인, 이벤트 기록, StepPay 호출 |
| `src/lib/supabase/client.ts` | 브라우저 Supabase 클라이언트 |
| `src/lib/supabase/server.ts` | 쿠키 기반 서버 Supabase 클라이언트 |
| `.env.example` | 필요한 환경변수 목록 |

## 8. 권장 다음 작업

### 우선순위 1: StepPay 실제 연동 확정

- 사용 중인 StepPay 상품/구독 API의 공식 엔드포인트와 버전 확인
- 인증 헤더 형식 확인
- 결제수단 변경 세션 생성에 필요한 고객 ID, 구독 ID, 복귀 URL 등 파라미터 확정
- 실제 응답 스키마에 맞춰 redirect URL 및 외부 요청 ID 파싱
- 네트워크 timeout, 비정상 JSON, 4xx/5xx 응답을 구분한 오류 처리
- 요청 성공과 실패를 `billing_events`에 반영
- webhook 서명 검증 및 멱등성 처리
- 완료 webhook 수신 후 `payment_methods` 동기화

### 우선순위 2: 데이터베이스 정의를 코드로 관리

- Supabase migration 추가
- 테이블 타입 및 enum 정의
- 외래키, unique 제약조건, 인덱스 추가
- RLS 정책과 테스트 케이스 추가
- Supabase CLI로 생성한 TypeScript Database 타입 적용

### 우선순위 3: 안정성 및 보안 강화

- 인증 콜백 오류 및 잘못된 code 처리
- 모든 Supabase 쿼리의 `error` 확인
- StepPay 구독 ID 누락 검증
- 외부 redirect URL allowlist 또는 신뢰 가능한 응답 검증
- 결제수단 변경 API에 중복 요청 방지 또는 rate limit 적용
- 로그에 토큰, 개인정보, 결제정보가 기록되지 않도록 점검
- service role key가 브라우저 번들에 포함되지 않는지 보장

### 우선순위 4: 제품 기능 및 UI 확장

- 로그아웃 및 공통 헤더
- 구독 상태, 사용량, 청구 이력 표시
- 플랜 변경 및 해지 요청 흐름
- 결제수단 변경 결과 화면
- 공통 버튼, 카드, 알림, 로딩 컴포넌트 분리
- 모바일/접근성/키보드 탐색 개선

### 우선순위 5: 테스트와 개발 자동화

- ESLint 및 포맷터 설정
- API route 단위 테스트
- 인증/대시보드/결제수단 변경 E2E 테스트
- 타입 검사, 린트, 테스트, 빌드를 실행하는 CI 추가

## 9. Codex에 전달할 다음 요청 예시

```text
CONTEXT.md를 먼저 읽고 현재 구현을 확인해 주세요.
StepPay의 실제 결제수단 변경 API 명세는 [링크 또는 첨부 문서]입니다.
명세에 맞게 src/app/api/billing/change-payment-method/route.ts를 완성하고,
성공/실패 billing_events 기록, 입력 검증, timeout 및 오류 처리를 추가해 주세요.
필요한 환경변수와 데이터베이스 변경도 문서화하고 테스트를 작성해 주세요.
```

실제 StepPay 명세나 Supabase schema dump가 제공되면 추측 대신 해당 자료를 기준으로 구현해야 합니다.
