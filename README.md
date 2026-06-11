# Replo Homepage

Replo의 고객센터 운영 구독 서비스를 소개하고, 무료 운영 진단 신청을 받기 위한 Next.js MVP입니다. 공개 홈페이지는 Claude로 제작한 오프라인 HTML 번들을 `public/replo-original/index.html`에 보존해 사용하며, CTA 클릭 시 같은 화면에서 진단 신청 모달을 엽니다.

가입형 고객 포털도 함께 포함되어 있어, 사용자는 회원가입과 이메일 인증 후 `/dashboard`에서 계정, 플랜, 결제수단 상태를 확인할 수 있습니다. 구현 범위와 데이터 모델은 [`CONTEXT.md`](./CONTEXT.md)에 정리되어 있습니다.

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

허용 origin에 없는 외부 URL은 `/dashboard`로 대체됩니다.

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
- `/signup`: 신규 가입 정보 입력 및 이메일 인증 요청
- `/login`: 기존 사용자의 Supabase 매직 링크 로그인
- `/auth/callback`: 인증 코드 교환 및 customer 초기화
- `/dashboard`: 인증된 사용자의 계정, 플랜 및 결제수단 조회
- `/billing/payment-method`: 결제수단 변경 시작 화면
- `/api/billing/change-payment-method`: 인증 및 구독 확인 후 StepPay 요청을 시작하는 서버 API

## 가입 및 인증 흐름

1. 신규 사용자는 `/signup`에서 이메일과 회사 정보를 입력합니다.
2. Supabase Auth가 이메일 인증 링크를 발송하며 가입 정보는 Auth user metadata에 보존됩니다.
3. `/auth/callback`이 인증 코드를 세션으로 교환하고 `customers.user_id` 기준으로 고객 row를 멱등 생성합니다.
4. 기존 사용자는 `/login`에서만 로그인 링크를 요청합니다. 이 화면은 `shouldCreateUser: false`로 신규 계정을 만들지 않습니다.
5. 인증된 사용자는 `/dashboard`에 진입하며, 구독이 없어도 플랜 선택 전 상태를 확인할 수 있습니다.

Supabase Auth 설정:

- Site URL: `https://replo.kr`
- Redirect URL: `https://replo.kr/auth/callback`
- 로컬 Redirect URL: `http://localhost:3000/auth/callback`

## 현재 주의사항

StepPay 연동의 엔드포인트, 인증 방식, 요청/응답 필드는 실제 계약 및 최신 API 명세로 검증되지 않았습니다. 운영 배포 전에 [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)와 `CONTEXT.md`의 미완성 항목 및 보안 체크리스트를 반드시 확인하세요.
