# Replo 공개 홈페이지 배포 가이드

운영 대상은 `https://replo.kr`이며 `main` 브랜치에는 공개 홈페이지와 운영 진단 접수 기능만 포함합니다.

## 배포 경로

- `/`: 공개 홈페이지
- `/contact`: 무료 운영 진단 신청
- `/diagnosis`: `/contact` redirect
- `/contatct/success`: 접수 완료
- `/api/diagnosis`: 진단 신청 저장 API
- `/replo-original/index.html`: 디자인 원본 보존 경로

로그인, 회원가입, Auth callback, 마이페이지, 대시보드, 결제 API는 운영 빌드에 포함하지 않습니다.

## 필수 환경변수

Vercel Production 환경에 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

선택 webhook:

```env
DIAGNOSIS_WEBHOOK_URL=
DIAGNOSIS_WEBHOOK_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY`, Redis token, webhook secret에는 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## Supabase

[`supabase.sql`](./supabase.sql)을 SQL Editor에서 실행하여 `diagnosis_responses` 테이블을 준비합니다.

운영 API는 service role client로만 row를 생성합니다. 브라우저에서 Supabase에 직접 insert하지 않습니다.

## Vercel

1. Production Branch가 `main`인지 확인합니다.
2. 위 환경변수를 Production 범위에 설정합니다.
3. `main` 배포 전에 Preview에서 빌드와 폼 제출을 검증합니다.
4. 검증된 `main` 커밋만 Production으로 배포합니다.

## DNS

Vercel이 제시하는 값을 우선 사용합니다. 일반적인 구성은 다음과 같습니다.

```txt
replo.kr      A      76.76.21.21
www.replo.kr  CNAME  cname.vercel-dns.com
```

## 배포 전 검증

```bash
npx tsc --noEmit
npm run build
```

- [ ] 빌드 결과에 고객 포털 전용 경로가 없음
- [ ] 홈페이지 CTA가 `/contact`로 연결됨
- [ ] 진단 신청이 Supabase에 저장됨
- [ ] webhook 설정 시 수신 시스템에 요청이 도착함
- [ ] `webhook_status`가 `sent`, `failed`, `skipped` 중 하나로 기록됨
- [ ] Redis 장애 시 API가 HTTP 503으로 실패함
- [ ] 실제 secret이 저장소나 브라우저 번들에 포함되지 않음
