# Replo Homepage 프로젝트 맥락

> 최종 코드 정리 기준일: 2026-06-10

## 1. 프로젝트 목적

Replo 공개 홈페이지, 운영 진단 신청, 가입형 SaaS 고객 포털을 제공하는 Next.js 프로젝트입니다. 신규 사용자는 이메일 인증으로 가입하고, 인증 완료 후 자신의 고객 정보와 플랜 및 결제수단 상태를 `/dashboard`에서 확인합니다.

## 2. 인증 흐름

### 신규 가입

1. 사용자가 `/signup`에서 이메일, 회사명, 담당자명, 연락처, 홈페이지 URL을 입력합니다.
2. 브라우저 Supabase 클라이언트가 `signInWithOtp`를 `shouldCreateUser: true`로 호출합니다.
3. 가입 정보는 Supabase Auth user metadata에 저장됩니다.
4. 이메일 링크는 `{NEXT_PUBLIC_SITE_URL}/auth/callback`으로 돌아옵니다.
5. 콜백이 인증 코드를 세션으로 교환한 뒤 `customers.user_id` 기준으로 고객 row를 멱등 생성합니다.
6. 사용자는 `/dashboard`로 이동합니다.

### 기존 사용자 로그인

1. 사용자가 `/login`에서 기존 계정 이메일을 입력합니다.
2. `signInWithOtp`를 `shouldCreateUser: false`로 호출하므로 로그인 화면에서는 신규 Auth 사용자를 만들지 않습니다.
3. 인증 코드가 없거나 교환에 실패하면 `/login?error=auth_failed`로 이동합니다.
4. 정상 인증된 사용자만 `/dashboard`로 이동합니다.

운영 빌드에서 `NEXT_PUBLIC_SITE_URL`이 없거나 localhost를 가리키면 인증 링크는 `https://replo.kr/auth/callback`을 안전한 fallback으로 사용합니다. 로컬 개발에서는 현재 브라우저 origin을 사용할 수 있습니다.

## 3. 고객 및 대시보드 흐름

- `/dashboard`는 서버에서 현재 Supabase 사용자를 확인하고 비로그인 사용자를 `/login`으로 보냅니다.
- 고객 row가 없으면 Auth metadata로 생성을 다시 시도합니다.
- 고객 초기화에 실패하면 재로그인 또는 고객센터 문의 안내를 표시합니다.
- `subscriptions`와 `payment_methods`는 `maybeSingle()`로 조회합니다.
- 신규 가입자에게 구독이 없어도 계정 상태, 플랜 선택 전 상태, 결제수단 미등록 상태를 정상 표시합니다.
- `tenant_users` 멤버십이 있는 운영 고객은 `/dashboard/[tenantId]` 상세 운영 대시보드로 이동할 수 있습니다.

## 4. 데이터 모델

### `customers`

| 필드 | 용도 |
| --- | --- |
| `id` | 고객 식별자 |
| `user_id` | Supabase Auth 사용자 ID, unique |
| `company_name` | 회사명 |
| `contact_name` | 담당자명 |
| `phone` | 연락처 |
| `website_url` | 홈페이지 또는 서비스 URL |
| `email` | 가입 이메일 |
| `status` | 계정 상태, 신규 기본값 `pending_plan` |
| `created_at` | 생성 시각 |

### `subscriptions`

고객별 플랜, 월 이용료, 포함 문의량, 다음 결제일, 구독 상태를 저장합니다. 신규 가입자는 row가 없을 수 있습니다.

### `payment_methods`

고객별 마스킹된 결제수단과 상태를 저장합니다. 원문 카드번호, CVC, 비밀번호는 저장하지 않습니다.

### `tenants` / `tenant_users`

실제 운영 데이터가 연결된 고객사의 상세 운영 대시보드 권한을 관리합니다. 고객 포털 가입과 운영 데이터 연결은 분리되어 있습니다.

## 5. RLS와 고객 초기화

고객 초기화는 인증 콜백의 사용자 세션으로 실행합니다. `customers` RLS는 `user_id = auth.uid()`인 row만 조회, 생성, 수정할 수 있게 제한합니다.

- 사용자는 자기 customer row만 조회, 생성, 수정 가능
- 사용자는 자기 customer에 속한 subscription만 조회 가능
- 사용자는 자기 customer에 속한 payment method만 조회 가능
- billing event 생성은 자기 customer와 subscription 조합으로 제한
- `SUPABASE_SERVICE_ROLE_KEY`는 진단 API와 운영 데이터 서버 작업에만 사용하며 브라우저에 노출하지 않음

스키마와 정책은 `docs/supabase.sql` 및 `supabase/migrations/202606100001_saas_customer_signup.sql`에 있습니다.

## 6. 환경변수

| 변수 | 공개 여부 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 공개 가능 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 공개 가능 | Supabase anon key, RLS 필수 |
| `NEXT_PUBLIC_SITE_URL` | 브라우저 공개 가능 | 로컬 `http://localhost:3000`, 운영 `https://replo.kr` |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | 진단 API 및 운영 서버 작업 |
| `STEPPAY_SECRET_TOKEN` | 서버 전용 | StepPay 연동 확정 후 사용 |
| `STEPPAY_API_BASE_URL` | 서버 설정 | StepPay API base URL |

## 7. Supabase Auth URL 설정

- Site URL: `https://replo.kr`
- Redirect URL: `https://replo.kr/auth/callback`
- 로컬 개발 Redirect URL: `http://localhost:3000/auth/callback`

## 8. 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/app/signup/page.tsx` | 신규 가입 및 인증 메일 요청 |
| `src/app/login/page.tsx` | 기존 사용자 매직 링크 로그인 |
| `src/app/auth/callback/route.ts` | 코드 교환 및 customer 초기화 |
| `src/lib/customers/initialize.ts` | 고객 row 멱등 생성 |
| `src/app/dashboard/page.tsx` | 가입형 고객 포털 |
| `src/app/dashboard/[tenantId]/page.tsx` | 연결 고객의 운영 상세 대시보드 |
| `src/app/api/billing/change-payment-method/route.ts` | 인증 및 구독 확인 후 StepPay 요청 |

## 9. 운영 전 확인

- Vercel의 `NEXT_PUBLIC_SITE_URL`이 `https://replo.kr`인지 확인
- Supabase Auth URL 설정에 운영 및 로컬 callback 등록
- 최신 migration 적용
- 가입 인증 후 `customers` row가 한 개만 생성되는지 확인
- 구독 없는 신규 사용자가 `/dashboard`를 정상 조회하는지 확인
- StepPay는 공식 계약 API 명세와 운영 credential 확인 후 활성화
