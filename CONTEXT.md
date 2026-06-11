# Replo Homepage 프로젝트 맥락

> 최종 코드 정리 기준일: 2026-06-11

## 1. 프로젝트 목적

Replo 공개 홈페이지, 운영 진단 신청, 가입형 SaaS 고객 포털을 제공하는 Next.js 프로젝트입니다. 신규 사용자는 Google OAuth 인증 후 고객사와 첫 브랜드를 생성합니다. `/mypage`는 계정, 플랜, 결제, 멤버, 연동 채널과 권한을 관리하고 `/dashboard`는 CS 운영 현황을 표시합니다.

## 2. 인증 흐름

### 신규 가입

1. 사용자가 `/signup`에서 Google OAuth를 시작합니다.
2. Supabase가 Google 인증을 완료한 뒤 `{NEXT_PUBLIC_SITE_URL}/auth/callback`으로 돌아옵니다.
3. 콜백은 profile을 갱신하고 기존 멤버십 또는 이메일 초대를 확인합니다.
4. 멤버십이 없으면 `/onboarding`에서 회사와 첫 브랜드를 입력합니다.
5. 서버가 customer, owner `customer_members`, brand를 생성한 뒤 `/mypage`로 이동합니다.

### 기존 사용자 로그인

1. `/login`의 기본 방식은 Google OAuth입니다.
2. 이메일 OTP는 하단 보조 로그인으로 유지하며 `shouldCreateUser: false`를 사용합니다.
3. 인증 코드가 없거나 교환에 실패하면 `/login?error=auth_failed`로 이동합니다.
4. 정상 인증된 사용자는 멤버십에 따라 `/mypage` 또는 `/onboarding`으로 이동합니다.

`NEXT_PUBLIC_SITE_URL`이 설정되어 있으면 해당 origin을 사용합니다. 값이 없거나 운영 빌드에서 localhost를 가리키면 브라우저의 현재 origin을 우선 사용하고, 서버에서는 Vercel의 `VERCEL_URL`을 fallback으로 사용합니다. 최종 fallback은 운영 빌드의 `https://replo.kr`, 로컬 빌드의 `http://localhost:3000`입니다.

## 3. 고객 포털 및 대시보드 흐름

- `/mypage`와 `/dashboard`는 서버에서 현재 Supabase 사용자를 확인하고 비로그인 사용자를 `/login`으로 보냅니다.
- 고객사 접근 권한은 `customers.user_id`가 아니라 `customer_members`로 판정합니다.
- 초대받은 사용자는 인증 콜백에서 이메일이 일치하는 pending invite를 수락합니다.
- `/mypage`에서 `subscriptions`와 `payment_methods`를 `maybeSingle()`로 조회하고 최근 `billing_events`를 확인합니다.
- 신규 가입자에게 구독이 없어도 마이페이지에서 플랜 선택 전 상태와 결제수단 미등록 상태를 정상 표시합니다.
- `/dashboard` 루트는 CS 운영 지표 요약을 표시하며, 현재 지표는 별도 mock data 파일에서 관리합니다.
- `tenant_users` 멤버십이 있는 운영 고객은 `/dashboard/[tenantId]` 상세 운영 대시보드로 이동할 수 있습니다.

## 4. 데이터 모델

### 고객사와 멤버십

- `profiles`: Auth 사용자 이름, 이메일, 아바타
- `customers`: 회사, 사업자 정보, 세금계산서 이메일
- `customer_members`: 사용자와 고객사 연결 및 owner/admin/editor/viewer 역할
- `member_invites`: 이메일 초대, 역할, 만료와 수락 상태
- `brands`: 고객사 소유 브랜드
- `channel_integrations`: 브랜드별 채널톡 연결과 암호화 credential
- `integration_consents`: 개인정보 처리 위탁 동의 기록
- `audit_logs`: 멤버 및 연동 변경 감사 로그

### `subscriptions`

고객별 플랜, 월 이용료, 포함 문의량, 다음 결제일, 구독 상태를 저장합니다. 신규 가입자는 row가 없을 수 있습니다.

### `payment_methods`

고객별 마스킹된 결제수단과 상태를 저장합니다. 원문 카드번호, CVC, 비밀번호는 저장하지 않습니다.

### `tenants` / `tenant_users`

실제 운영 데이터가 연결된 고객사의 상세 운영 대시보드 권한을 관리합니다. 고객 포털 가입과 운영 데이터 연결은 분리되어 있습니다.

## 5. RLS와 고객 초기화

RLS는 `customer_members`의 active membership을 기준으로 고객사 범위를 제한합니다.

- 모든 멤버는 자기 고객사의 customer, subscription, payment method, brand를 조회 가능
- owner/admin만 고객사 및 브랜드 변경 가능
- 멤버/연동 변경 API는 서버에서 로그인 사용자와 역할을 다시 확인
- 암호화 credential이 있는 `channel_integrations`는 authenticated 직접 SELECT를 허용하지 않음
- `SUPABASE_SERVICE_ROLE_KEY`와 `INTEGRATION_ENCRYPTION_KEY`는 서버에서만 사용

스키마와 정책은 `docs/supabase.sql` 및 `supabase/migrations/202606100001_saas_customer_signup.sql`에 있습니다.

## 6. 환경변수

| 변수 | 공개 여부 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 공개 가능 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 공개 가능 | Supabase anon key, RLS 필수 |
| `NEXT_PUBLIC_SITE_URL` | 브라우저 공개 가능 | 로컬 `http://localhost:3000`, 개발/검수 `https://dev.replo.kr`, 운영 `https://replo.kr` |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | 진단 API 및 운영 서버 작업 |
| `INTEGRATION_ENCRYPTION_KEY` | 서버 전용 | 채널톡 Access Key/Secret AES-256-GCM 암호화 |
| `STEPPAY_SECRET_TOKEN` | 서버 전용 | StepPay 연동 확정 후 사용 |
| `STEPPAY_API_BASE_URL` | 서버 설정 | StepPay API base URL |

## 7. Supabase Auth URL 설정

- Site URL: `https://replo.kr`
- Redirect URL: `https://replo.kr/auth/callback`
- 로컬 개발 Redirect URL: `http://localhost:3000/auth/callback`
- Google provider 활성화 및 Google Client ID/Secret 등록
- 카카오 로그인은 현재 범위에서 제외

## 8. 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/app/signup/page.tsx` | Google 신규 가입 시작 |
| `src/app/login/page.tsx` | Google 기본 로그인 및 이메일 보조 로그인 |
| `src/app/auth/callback/route.ts` | 코드 교환, 프로필 동기화, 초대 수락 |
| `src/app/onboarding/page.tsx` | 고객사와 첫 브랜드 생성 |
| `src/lib/customers/access.ts` | 고객사 멤버십 및 역할 확인 |
| `src/app/mypage/page.tsx` | 계정, 플랜, 결제, 멤버, 연동, 가이드, 권한 정보 |
| `src/app/dashboard/page.tsx` | CS 운영 현황 요약 대시보드 |
| `src/data/operations-dashboard.ts` | 운영 대시보드 mock 지표 |
| `src/app/dashboard/[tenantId]/page.tsx` | 연결 고객의 운영 상세 대시보드 |
| `src/app/api/billing/change-payment-method/route.ts` | 인증 및 구독 확인 후 StepPay 요청 |

## 9. 운영 전 확인

- Vercel의 `NEXT_PUBLIC_SITE_URL`이 `https://replo.kr`인지 확인
- Supabase Auth URL 설정에 운영 및 로컬 callback 등록
- 최신 migration 적용
- Google OAuth 인증 후 onboarding과 owner 멤버십이 생성되는지 확인
- Supabase에 `202606110001_customer_workspaces.sql` migration 적용
- Vercel에 `INTEGRATION_ENCRYPTION_KEY` 설정
- 고객사별 연결 상태 채널톡이 10개를 넘지 않는지 확인
- 구독 없는 신규 사용자가 `/mypage`를 정상 조회하는지 확인
- 인증된 사용자가 `/dashboard` 운영 현황을 조회하는지 확인
- StepPay는 공식 계약 API 명세와 운영 credential 확인 후 활성화
