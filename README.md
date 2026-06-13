# Replo Homepage

Replo의 고객센터 운영 구독 서비스를 소개하고, 무료 운영 진단 신청을 받기 위한 Next.js MVP입니다. 공개 홈페이지는 Claude로 제작한 오프라인 HTML 번들을 `public/replo-original/index.html`에 보존해 사용하며, CTA 클릭 시 같은 화면에서 진단 신청 모달을 엽니다.

가입형 고객 포털도 함께 포함되어 있어, 사용자는 Google 인증과 회사 온보딩 후 `/mypage`에서 계정, 플랜, 결제, 멤버, 브랜드별 채널 연동, 응대 가이드와 권한 정보를 확인할 수 있습니다. `/dashboard`는 CS 운영 현황을 확인하는 화면입니다. 구현 범위와 데이터 모델은 [`CONTEXT.md`](./CONTEXT.md)에 정리되어 있습니다.

개발/검수용 `dev.replo.kr` 환경 분리 기준과 수동 설정 항목은 [`docs/DEV_ENVIRONMENT.md`](./docs/DEV_ENVIRONMENT.md)를 참고하세요.

## 기술 스택

- Next.js 14 App Router
- React 18 / TypeScript
- Tailwind CSS
- Supabase Auth / Database
- StepPay API 연동 골격

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 Supabase 프로젝트 정보를 입력해야 진단 신청 저장과 로그인 기능을 테스트할 수 있습니다. 비밀 키가 포함된 로컬 환경 파일은 Git에 커밋하지 마세요.

`NEXT_PUBLIC_SITE_URL`은 인증 메일의 콜백 origin입니다.

```bash
# 로컬
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 개발/검수
NEXT_PUBLIC_SITE_URL=https://dev.replo.kr

# 운영
NEXT_PUBLIC_SITE_URL=https://replo.kr
```

진단 신청을 외부 시스템으로 전달하려면 서버 전용 환경변수를 추가합니다.

```bash
DIAGNOSIS_WEBHOOK_URL=
DIAGNOSIS_WEBHOOK_SECRET=
```

Vercel에서는 Project Settings → Environment Variables에서 `DIAGNOSIS_WEBHOOK_URL`을 Production 환경에 추가한 뒤 재배포하세요. 이 값은 서버 API에서만 읽어야 하므로 `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다. `NEXT_PUBLIC_` 변수는 브라우저 번들에 노출될 수 있습니다.

로컬 테스트는 webhook.site 같은 임시 수신 URL을 `DIAGNOSIS_WEBHOOK_URL`에 넣고 `/contact`에서 신청을 제출한 뒤 POST 본문이 도착하는지 확인하면 됩니다. Supabase에서는 `diagnosis_responses` 테이블의 `website_url`, `webhook_status`, `webhook_sent_at`, `webhook_error` 컬럼을 확인하세요. URL이 없으면 `skipped`, 전송 성공 시 `sent`, 실패 시 `failed`로 기록됩니다.

결제수단 변경을 실제 StepPay로 연결할 때는 StepPay가 반환하는 리다이렉트 URL의 origin을 서버 전용 환경변수에 쉼표로 등록하세요.

```bash
STEPPAY_ALLOWED_REDIRECT_ORIGINS=https://example.steppay.io
```

허용 origin에 없는 외부 URL은 `/mypage`로 대체됩니다.

## 홈페이지 비교 구현

- `/`는 source 기반 React 홈페이지를 표시합니다.
- `/replo-original/index.html`에는 Claude 디자인 원본 홈페이지가 비교용으로 보존되어 있습니다.
- `/react-home`은 처음에 수작업으로 재구성한 React 비교 버전입니다.
- `/source-home`은 Claude export ZIP의 `marketing.jsx`, `marketing2.jsx`, `ui.jsx`와 원본 CSS 클래스/규칙을 기반으로 Next.js에 포팅한 비교 버전입니다.
- `/source-home`과 `/`는 동일한 source 기반 React 홈페이지를 렌더링하며, 원본 번들은 별도 경로에서 계속 비교할 수 있습니다.

## 주요 경로

- `/`: source 기반 React 공개 홈페이지
- `/replo-original/index.html`: 보존된 Claude 원본 홈페이지
- `/react-home`: 첫 수작업 React 비교 버전
- `/source-home`: 원본 JSX/CSS source 기반 React 포트
- 홈페이지 CTA 모달: 무료 운영 진단 신청 폼
- `/api/diagnosis`: 진단 신청 저장 API
- `/signup`: Google 신규 회원가입 시작
- `/login`: Google 기본 로그인 및 이메일 보조 로그인
- `/auth/callback`: Supabase OAuth/인증 코드 교환 및 멤버 초대 수락
- `/onboarding`: 신규 고객사와 첫 브랜드 생성
- `/mypage`: 고객 계정, 이용 플랜, 결제, 멤버, 연동 채널, 응대 가이드, 권한 정보 확인
- `/dashboard`: 인증된 사용자의 CS 운영 현황 대시보드
- `/billing/payment-method`: 결제수단 변경 시작 화면
- `/api/billing/change-payment-method`: 인증 및 구독 확인 후 StepPay 요청을 시작하는 서버 API

## 가입 및 인증 흐름

1. 신규 사용자는 `/signup`에서 Google OAuth를 시작합니다. 카카오 로그인은 현재 제공하지 않습니다.
2. `/auth/callback`이 인증 코드를 세션으로 교환하고 프로필 및 기존 초대 여부를 확인합니다.
3. 고객사 멤버십이 없으면 `/onboarding`에서 회사와 첫 브랜드를 생성하고 owner 역할을 부여합니다.
4. 기존 사용자는 `/login`에서 Google 로그인을 사용합니다. 이메일 OTP는 `shouldCreateUser: false`인 보조 로그인입니다.
5. 초대받은 이메일로 인증하면 대기 중인 `member_invites`가 `customer_members` 멤버십으로 전환됩니다.
6. 인증된 사용자는 `/mypage`에 진입하며, 구독이 없어도 플랜 선택 전 상태를 확인할 수 있습니다.
7. `/dashboard`에서 월간 문의 처리 현황과 운영 이슈를 확인할 수 있습니다.

Supabase Auth 설정:

- Site URL: `https://replo.kr`
- Redirect URL: `https://replo.kr/auth/callback`
- 로컬 Redirect URL: `http://localhost:3000/auth/callback`
- Authentication → Providers에서 Google provider 활성화
- Google Cloud OAuth Client의 Authorized redirect URI에 Supabase가 안내하는 callback URL 등록

## 멤버 및 채널톡 연동

- 고객사 권한은 `customer_members`의 `owner`, `admin`, `editor`, `viewer` 역할로 관리합니다.
- owner/admin만 멤버 초대, 역할 변경, 멤버 삭제와 채널 연동 변경을 수행할 수 있습니다.
- editor/viewer는 멤버와 연동 상태를 조회할 수 있습니다.
- 채널톡은 고객사 기준 연결 상태인 연동을 최대 10개까지 등록할 수 있습니다.
- Access Key와 Access Secret은 서버 전용 `INTEGRATION_ENCRYPTION_KEY`로 암호화하며 Secret은 화면에 다시 표시하지 않습니다.
- 채널톡 추가 전 상담·고객·주문 데이터의 개인정보 처리 위탁 동의가 필요합니다.
- 최신 스키마는 `supabase/migrations/202606110001_customer_workspaces.sql`에 있습니다.

## 현재 주의사항

StepPay 연동의 엔드포인트, 인증 방식, 요청/응답 필드는 실제 계약 및 최신 API 명세로 검증되지 않았습니다. 운영 배포 전에 [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)와 `CONTEXT.md`의 미완성 항목 및 보안 체크리스트를 반드시 확인하세요.

## dev 운영 검수

`dev` 포털은 customer와 tenant를 하나의 워크스페이스로 연결합니다. 신규 온보딩은
하나의 DB 함수 안에서 customer, owner membership, brand, tenant, tenant membership을
원자적으로 생성합니다. 채널톡 연동은 이 tenant를 sync 대상으로 사용합니다.

```bash
npm install
npm run check:env
npm test
npm run build
```

개발 Supabase에는 `supabase/migrations`를 파일명 순서대로 적용해야 합니다.
특히 `202606090001_operations_dashboard.sql`과
`202606130001_operational_readiness.sql`이 없으면 상세 대시보드와 동기화가 동작하지
않습니다. 전체 검수 절차는
[`docs/QA_OPERATIONAL_READINESS.md`](./docs/QA_OPERATIONAL_READINESS.md)를 따릅니다.

현재 운영 가능 범위:

- Google 인증, 온보딩, 고객/tenant 권한 연결
- customer 범위 멤버 관리와 채널톡 credential 저장
- 검증된 ChannelTalk credential을 사용한 수동/cron sync
- 샘플과 실데이터가 구분된 대시보드
- allowlist 기반 읽기 전용 `/admin`

의도적으로 제한된 범위:

- StepPay는 모든 운영 env와 구독 ID가 갖춰지기 전까지 운영팀 수동 처리로 접수
- 네이버, 쿠팡, 카카오, Cafe24 connector는 준비 중
- 실제 ChannelTalk credential이 없으면 sync 성공을 mock으로 대체하지 않음
- 개발용 Supabase가 분리되지 않은 상태에서는 portal migration을 운영 DB에 적용하지 않음
- Next 14 잔여 보안 advisory가 있어 Next 16/React 19 마이그레이션 전에는 프로덕션 승격 금지
