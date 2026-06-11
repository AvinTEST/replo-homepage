# Replo Homepage 프로젝트 맥락

> 운영 브랜치 정리 기준일: 2026-06-11

## 운영 브랜치 역할

`main`은 `https://replo.kr` 공개 홈페이지와 무료 CS 운영 진단 접수만 담당합니다.

고객 포털 기능은 `dev` 브랜치에서 관리합니다.

- Google 및 이메일 인증
- 회원가입과 온보딩
- 마이페이지
- 운영 대시보드
- 멤버와 브랜드 관리
- 채널톡 연동
- 결제 및 구독

## 공개 흐름

1. 사용자가 `/`의 CTA 또는 `/contact`로 이동합니다.
2. 단일 페이지 dropdown 기반 진단 폼을 작성합니다.
3. 브라우저가 `POST /api/diagnosis`를 호출합니다.
4. 서버가 rate limit과 입력값을 검증합니다.
5. 서버 전용 Supabase service role client가 `diagnosis_responses`에 저장합니다.
6. webhook이 설정된 경우 외부 운영 시스템으로 전달합니다.
7. 사용자는 접수 완료 화면으로 이동합니다.

## 운영 환경변수

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 진단 신청 저장 및 webhook 상태 갱신 |
| `UPSTASH_REDIS_REST_URL` | 운영 rate limit Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | 운영 rate limit Redis token |
| `DIAGNOSIS_WEBHOOK_URL` | 선택 사항, 진단 신청 전달 URL |
| `DIAGNOSIS_WEBHOOK_SECRET` | 선택 사항, webhook 인증 값 |

`KV_REST_API_URL`, `KV_REST_API_TOKEN`도 Redis 호환 별칭으로 지원합니다.

## 보안 기준

- service role key와 webhook secret은 서버에서만 읽습니다.
- 공개 폼에서 카드 정보나 인증 정보를 받지 않습니다.
- 운영 rate limiter가 준비되지 않으면 접수를 실패 처리하여 무제한 요청을 허용하지 않습니다.
- 공개 홈페이지 CTA는 `/contact`로 연결합니다.
- 포털 기능을 운영 브랜치에 다시 추가하지 않습니다.
