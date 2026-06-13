# Replo 포털 운영 준비 QA

대상은 `dev` 브랜치와 개발용 Supabase 프로젝트입니다. 운영 Supabase에 테스트
고객, 채널 credential, 결제 요청을 만들지 않습니다.

## 사전 조건

1. `supabase/migrations`를 파일명 순서대로 개발 프로젝트에 적용합니다.
2. `npm run check:env`가 오류 없이 끝나는지 확인합니다.
3. Preview의 `NEXT_PUBLIC_SITE_URL`은 `https://dev.replo.kr`이어야 합니다.
4. `ADMIN_EMAILS`에 검수 담당자 이메일만 등록합니다.
5. StepPay 계약 명세를 검증하지 않았다면 관련 env 3개를 모두 비워 둡니다.

## 공개 및 인증

- [ ] 비로그인 상태에서 `/`와 `/contact`가 정상 표시된다.
- [ ] `/contact` 진단 신청이 `diagnosis_responses`에 저장된다.
- [ ] 비로그인 상태에서 `/mypage`, `/dashboard`, `/billing/payment-method` 접근 시 `/login`으로 이동한다.
- [ ] Google 회원가입 후 `/auth/callback`을 거쳐 `/onboarding`으로 이동한다.
- [ ] 로그아웃 후 보호 페이지와 보호 API 접근이 다시 차단된다.

## 온보딩과 데이터 모델

- [ ] 온보딩 완료 후 `profiles` row가 생성된다.
- [ ] 같은 요청으로 `customers`, `customer_members`, `brands` row가 생성된다.
- [ ] 같은 요청으로 `tenants`, `tenant_users` row가 생성된다.
- [ ] `customers.tenant_id`가 생성된 `tenants.id`와 일치한다.
- [ ] 중간 오류를 강제로 발생시켰을 때 부분 customer/tenant 데이터가 남지 않는다.
- [ ] `/mypage`의 상세 운영 링크가 `customers.tenant_id`를 사용한다.

## 권한 격리

- [ ] 다른 고객의 `tenantId`로 `/dashboard/{tenantId}` 접근 시 404가 표시된다.
- [ ] 다른 고객의 integration/member ID를 PATCH 또는 DELETE하면 404가 반환된다.
- [ ] 비로그인 보호 API 요청은 401을 반환한다.
- [ ] 권한이 부족한 멤버의 변경 요청은 403을 반환한다.
- [ ] 외부 Origin으로 상태 변경 API를 호출하면 403을 반환한다.
- [ ] owner/admin 변경이 `tenant_users` 역할에도 반영된다.
- [ ] 멤버 삭제 시 해당 사용자의 `tenant_users` row도 삭제된다.

## 채널톡과 동기화

- [ ] 마이페이지에서 채널톡 연결 저장 시 `tenant_id`, `customer_id`, `brand_id`가 함께 저장된다.
- [ ] Access Key/Secret 원문이 DB나 응답에 표시되지 않는다.
- [ ] 잘못된 credential은 명확한 연결 오류를 반환한다.
- [ ] `/api/cron/sync` 대상은 connected이며 `tenant_id`가 있는 row로 제한된다.
- [ ] 신규 분리 암호화 컬럼과 레거시 `encrypted_credentials`가 모두 복호화된다.
- [ ] sync 후 `operation_events`, `daily_operation_metrics`, `sync_jobs`가 갱신된다.
- [ ] credential이 없으면 mock 성공 대신 명확한 오류를 반환한다.

## 결제 안전 상태

- [ ] 구독 없는 신규 가입자가 변경 요청을 눌러도 404/500이 발생하지 않는다.
- [ ] StepPay env가 없으면 외부 페이지를 열지 않고 HTTP 202로 접수된다.
- [ ] `billing_events.payment_method_change_requested` 기록이 남는다.
- [ ] StepPay env가 일부만 설정되면 `npm run check:env`가 실패한다.
- [ ] 허용되지 않은 redirect origin은 브라우저 이동에 사용되지 않는다.
- [ ] 카드번호, CVC, 비밀번호 입력 필드가 없다.

## 대시보드와 운영자 화면

- [ ] `/dashboard`에 `샘플 데이터 · 운영 데이터 연결 전` 배지가 표시된다.
- [ ] metric이 없으면 동기화된 운영 데이터가 없다는 빈 상태가 표시된다.
- [ ] metric이 있을 때만 실시간 상세 운영 링크가 표시된다.
- [ ] allowlist 운영자는 `/admin`에서 최근 진단, 가입, 결제 요청, 연동을 조회한다.
- [ ] 일반 고객은 `/admin` 접근 시 404를 받는다.

## 모바일 및 실패 양상

- [ ] 375px 폭에서 온보딩, 마이페이지, 결제 요청 화면에 가로 스크롤이 없다.
- [ ] 필수 Supabase env가 없으면 `npm run check:env`가 변수명을 명확히 출력한다.
- [ ] Preview/Production에서 Redis env가 없으면 env 검사가 실패한다.
- [ ] `INTEGRATION_ENCRYPTION_KEY`가 없으면 credential 저장이 실패하고 비밀값은 로그에 남지 않는다.
