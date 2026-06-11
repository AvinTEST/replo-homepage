# dev.replo.kr 환경 분리 체크리스트

운영 서비스에 영향을 주지 않도록 `main`과 `dev` 배포를 분리하는 기준입니다.
이 문서는 설정 가이드이며 Vercel, DNS, Supabase, Google Cloud Console 설정을 자동으로 변경하지 않습니다.

## 권장 환경 구성

| 환경 | Git 브랜치 | 도메인 | Vercel 환경 | Supabase |
| --- | --- | --- | --- | --- |
| 운영 | `main` | `https://replo.kr` | Production | 운영 프로젝트 |
| 개발/검수 | `dev` | `https://dev.replo.kr` | Preview | 개발 프로젝트 |
| 로컬 | 개발 브랜치 | `http://localhost:3000` | Local | 개발 프로젝트 |

현재 저장소에는 `dev` 브랜치가 없습니다. 작업 트리가 깨끗한지 확인한 후 아래 명령으로 생성할 수 있습니다.

```bash
git status --short
git switch -c dev
git push -u origin dev
```

## Vercel 환경변수

Production 범위:

```env
NEXT_PUBLIC_SITE_URL=https://replo.kr
NEXT_PUBLIC_SUPABASE_URL=<production-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
INTEGRATION_ENCRYPTION_KEY=<production-encryption-key>
```

Preview 범위:

```env
NEXT_PUBLIC_SITE_URL=https://dev.replo.kr
NEXT_PUBLIC_SUPABASE_URL=<development-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<development-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<development-service-role-key>
INTEGRATION_ENCRYPTION_KEY=<development-encryption-key>
```

서버 기능 사용 여부에 따라 아래 변수도 환경별로 분리합니다.

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `DIAGNOSIS_WEBHOOK_URL`
- `DIAGNOSIS_WEBHOOK_SECRET`
- `CRON_SECRET`
- `STEPPAY_SECRET_TOKEN`
- `STEPPAY_API_BASE_URL`
- `STEPPAY_ALLOWED_REDIRECT_ORIGINS`

Preview에는 운영 StepPay 토큰, 운영 webhook, 운영 채널 연동 자격 증명을 넣지 않습니다.

## Vercel 및 DNS

- [ ] Vercel 프로젝트의 Production Branch가 `main`인지 확인
- [ ] `dev` 브랜치 배포가 Preview 환경으로 생성되는지 확인
- [ ] `dev.replo.kr` 도메인 추가
- [ ] `dev.replo.kr`을 `dev` 브랜치 배포에 연결
- [ ] Production과 Preview 환경변수를 위 표에 맞게 분리
- [ ] 설정 변경 후 Production이 아닌 `dev` 브랜치만 재배포
- [ ] Preview 배포를 Production으로 Promote하지 않기

DNS:

```txt
Type: CNAME
Name: dev
Value: cname.vercel-dns.com
```

## Supabase Auth

개발용 Supabase 프로젝트를 별도로 만드는 구성을 권장합니다.

운영 프로젝트:

```txt
Site URL: https://replo.kr
Redirect URL: https://replo.kr/auth/callback
```

개발 프로젝트:

```txt
Site URL: https://dev.replo.kr
Redirect URL: https://dev.replo.kr/auth/callback
Redirect URL: http://localhost:3000/auth/callback
```

운영 Supabase를 임시로 공유한다면 아래 세 URL을 모두 허용해야 합니다.

```txt
https://replo.kr/auth/callback
https://dev.replo.kr/auth/callback
http://localhost:3000/auth/callback
```

개발 프로젝트에는 운영과 동일한 migration을 적용하되, 운영 customer, 결제, 채널 연동 데이터는 복사하지 않습니다.

## Google OAuth

Google Cloud Console의 Authorized JavaScript origins:

```txt
https://replo.kr
https://dev.replo.kr
http://localhost:3000
```

Authorized redirect URIs에는 앱의 `/auth/callback`이 아니라 각 Supabase 프로젝트의 Google callback을 등록합니다.

```txt
https://<production-project-ref>.supabase.co/auth/v1/callback
https://<development-project-ref>.supabase.co/auth/v1/callback
```

Google Client ID와 Client Secret은 각 Supabase 프로젝트의 Google Auth Provider 설정에만 입력합니다. 저장소나 `NEXT_PUBLIC_` 환경변수에는 넣지 않습니다.

## Supabase 구성 선택

### A. 운영 프로젝트 공유

- 빠르게 구성할 수 있지만 테스트 사용자, customer, 브랜드, API 연동 데이터가 운영 DB에 섞입니다.
- RLS, webhook, 결제 테스트 실수로 운영 데이터에 영향을 줄 수 있습니다.

### B. 개발 프로젝트 분리

- 운영 데이터와 Auth 사용자를 보호하고 migration, RLS, 가입, 채널 연동을 안전하게 검수할 수 있습니다.
- 프로젝트별 migration과 환경변수 관리가 추가로 필요합니다.

회원가입, 고객사, 채널톡, 결제 기능이 있으므로 B안을 권장합니다.

## 테스트 순서

1. `dev` 브랜치를 push하고 Preview 배포가 생성되는지 확인합니다.
2. `https://dev.replo.kr`에서 회원가입과 Google 로그인을 테스트합니다.
3. OAuth 이후 `https://dev.replo.kr/auth/callback`을 거쳐 `/mypage`로 이동하는지 확인합니다.
4. 개발 Supabase에서 profile, customer, membership row 생성 여부를 확인합니다.
5. 진단, 채널 연동, 결제 기능이 운영 DB와 운영 외부 API를 호출하지 않는지 확인합니다.
6. `https://replo.kr`의 로그인과 공개 페이지가 기존 상태인지 확인합니다.
