# Airtable 고객 동기화 (Supabase → Airtable)

Supabase `public.customers` 테이블에 새 row가 **INSERT**되면 Supabase Database
Webhook이 Next.js API Route를 호출하고, 그 Route가 서버에서만 Airtable API를
호출해 기존 Airtable 테이블에 레코드를 생성한다.

```
Supabase customers INSERT
  → Supabase Database Webhook (POST, Authorization: Bearer SUPABASE_WEBHOOK_SECRET)
  → POST /api/integrations/airtable/customers   (서버 전용)
  → Airtable API (records.create)
  → Supabase customers row write-back (airtable_record_id / airtable_synced_at)
```

프론트엔드는 Airtable 토큰을 절대 사용하지 않는다. 모든 Airtable 호출은
`src/lib/integrations/airtable.ts`(server-only)를 통해 API Route에서만 일어난다.

## 대상 Airtable

| 항목 | 값 |
| --- | --- |
| Base ID | `appdYCsGtltnVjq5d` |
| Table ID | `tblfEo1KNmQU95WFD` |
| View ID | `viwzvbhKOvxoK6bjY` (레코드 생성에는 불필요, 조회/검증용) |

Base/Table ID는 코드에 하드코딩하지 않고 환경변수로 읽는다.

## 1. 환경변수

서버 전용. `NEXT_PUBLIC_` 접두사를 절대 붙이지 말 것.

| 변수 | 설명 |
| --- | --- |
| `AIRTABLE_ACCESS_TOKEN` | Airtable PAT. `data.records:read`/`data.records:write` 권한 + 대상 base 접근 |
| `AIRTABLE_BASE_ID` | `appdYCsGtltnVjq5d` |
| `AIRTABLE_CUSTOMERS_TABLE_ID` | `tblfEo1KNmQU95WFD` |
| `SUPABASE_WEBHOOK_SECRET` | Supabase Webhook이 보내는 Bearer 토큰 검증값 |
| `NEXT_PUBLIC_SUPABASE_URL` | (이미 존재) write-back용 |
| `SUPABASE_SERVICE_ROLE_KEY` | (이미 존재) write-back용, 서버 전용 |
| `AIRTABLE_CUSTOMERS_FIELD_MAP` | (선택) 컬럼→실제 Airtable 필드명 JSON 오버라이드 |
| `AIRTABLE_CUSTOMERS_ID_FIELD` | (선택) Supabase id를 저장하는 Airtable 필드명. 있으면 정확 중복방지 |

dev(`dev.replo.kr`)와 prod(`replo.kr`)는 서로 다른 Airtable Table/Token을
환경변수로 지정해 분리한다. **운영 테이블에 테스트 데이터가 쌓이지 않도록 dev에서
먼저 검증**한다.

## 2. Airtable 기존 필드명 확인 (배포 전 필수)

> ⚠️ 이 작업 환경에는 Airtable 토큰이 없어 실제 필드명을 확인하지 못했다.
> 코드의 기본 매핑(`회사명`, `이메일` 등)은 **모두 추정값(confidence < 0.8)**이며
> `route.ts`에 `TODO_MAPPING_REVIEW`로 표기돼 있다. 운영 전에 반드시 아래 절차로
> 실제 필드명을 확인하고 `AIRTABLE_CUSTOMERS_FIELD_MAP`으로 교정할 것.
> 존재하지 않는 필드명으로 create를 호출하면 레코드 생성이 실패한다.

토큰을 준비한 뒤, 기존 레코드 1~3개를 조회해 실제 필드명을 파악한다:

```bash
curl -s "https://api.airtable.com/v0/appdYCsGtltnVjq5d/tblfEo1KNmQU95WFD?maxRecords=3" \
  -H "Authorization: Bearer $AIRTABLE_ACCESS_TOKEN" | jq '.records[].fields | keys'
```

(또는 Metadata API: `https://api.airtable.com/v0/meta/bases/appdYCsGtltnVjq5d/tables`)

확인된 실제 필드명으로 매핑을 교정한다. 코드 수정 없이 환경변수로:

```env
AIRTABLE_CUSTOMERS_FIELD_MAP={"company_name":"회사명","contact_name":"담당자","email":"이메일","phone":"연락처","website_url":"웹사이트","status":"상태","created_at":"가입일"}
```

## 3. 매핑표 (현재 기본값, 미검증)

| Supabase `customers` 컬럼 | Airtable 필드(추정) | 변환 | 확신도 |
| --- | --- | --- | --- |
| `company_name` | `회사명` | 문자열 그대로 | 0.7 |
| `contact_name` | `담당자` | 문자열 그대로 | 0.6 |
| `email` | `이메일` | 문자열 그대로 | 0.7 |
| `phone` | `연락처` | 문자열 그대로 | 0.6 |
| `website_url` | `웹사이트` | 문자열 그대로 | 0.5 |
| `status` | `상태` | single select 값(옵션 존재 시) | 0.4 |
| `created_at` | `가입일` | ISO 날짜 문자열 | 0.5 |

- 값이 없는(`null`/빈문자) 필드는 전송하지 않는다.
- `typecast: true`로 보내 single select/날짜의 문자열 입력을 관용 처리한다.
- 매핑 결과가 완전히 비면 `422`를 반환하고 create를 시도하지 않는다.

## 4. 중복 방지

순서대로:

1. Supabase `customers.airtable_record_id`가 이미 있으면 → `skipped: "Already synced"`.
2. `AIRTABLE_CUSTOMERS_ID_FIELD`가 설정돼 있으면 `filterByFormula`로 그 필드 =
   `record.id` 검색 → 있으면 write-back 후 skip.
3. 위 필드가 없으면 **email 기준**으로 fallback 검색(`AIRTABLE_CUSTOMERS_FIELD_MAP`의
   email 필드). 있으면 skip.

> **리스크:** 기존 Airtable 테이블에 Supabase id 저장 필드가 없으면 email 기반
> 중복방지는 동일 이메일 재사용 시 오탐/누락이 가능하다. 안정적 중복방지를 위해
> Airtable에 `Supabase ID`(single line text) 필드를 추가하고
> `AIRTABLE_CUSTOMERS_ID_FIELD=Supabase ID`로 지정하는 것을 권장한다.

formula 문자열은 백슬래시/작은따옴표를 escape 처리한다(`airtable.ts`).

## 5. Supabase 동기화 상태 컬럼

`supabase/migrations/20260615000000_customers_airtable_sync.sql`:

```sql
alter table public.customers
  add column if not exists airtable_record_id text,
  add column if not exists airtable_synced_at timestamptz,
  add column if not exists airtable_sync_error text;
```

- create 성공 후 `airtable_record_id`, `airtable_synced_at` 기록, `airtable_sync_error`는 null.
- write-back 실패는 Airtable create 성공을 무효화하지 않는다. 응답에 `warning`을
  포함하고 서버 로그에 남긴다.
- create 실패 시 `airtable_sync_error`에 사유를 기록한다.

## 6. Supabase Webhook 설정 (사용자가 직접)

Supabase Dashboard → Database → Webhooks → Create:

| 항목 | 값 |
| --- | --- |
| Name | `customers_to_airtable` |
| Table | `public.customers` |
| Events | `INSERT` |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://dev.replo.kr/api/integrations/airtable/customers` (운영: `https://replo.kr/...`) |
| Headers | `Content-Type: application/json`, `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>` |

## 7. 테스트

API Route 동작 검증(curl). `customers` 실제 컬럼명 기준 payload.

```bash
# 1) Authorization 없음 → 401
curl -i -X POST "https://dev.replo.kr/api/integrations/airtable/customers" \
  -H "Content-Type: application/json" -d '{}'

# 2) 잘못된 토큰 → 401
curl -i -X POST "https://dev.replo.kr/api/integrations/airtable/customers" \
  -H "Authorization: Bearer wrong" -H "Content-Type: application/json" -d '{}'

# 3) 올바른 토큰 + INSERT → Airtable 생성, { ok: true, airtableRecordId }
curl -i -X POST "https://dev.replo.kr/api/integrations/airtable/customers" \
  -H "Authorization: Bearer $SUPABASE_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "customers",
    "schema": "public",
    "record": {
      "id": "00000000-0000-0000-0000-000000000001",
      "company_name": "테스트 고객사",
      "contact_name": "홍길동",
      "email": "test@example.com",
      "phone": "010-0000-0000",
      "website_url": "https://example.com",
      "status": "pending_plan",
      "created_at": "2026-06-15T00:00:00.000Z"
    }
  }'

# 4) 같은 payload 재전송 → 중복 생성 안 됨 ({ skipped: true, reason: "Already synced" })
#    (3번과 동일하게 다시 실행)

# 5) UPDATE payload → skipped
curl -s -X POST "https://dev.replo.kr/api/integrations/airtable/customers" \
  -H "Authorization: Bearer $SUPABASE_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"UPDATE","table":"customers","schema":"public","record":{"id":"x"}}'

# 6) 다른 테이블 → skipped
curl -s -X POST "https://dev.replo.kr/api/integrations/airtable/customers" \
  -H "Authorization: Bearer $SUPABASE_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"orders","schema":"public","record":{"id":"x"}}'
```

검증 포인트:
- Airtable 기존 필드에 값이 정확히 들어갔는지(2번 절차로 필드명 교정 후).
- Vercel Function Logs에 토큰/secret이 출력되지 않는지, 에러가 없는지.

## 8. 남은 리스크 / 확인 필요

1. **Airtable 실제 필드명 미검증** — 운영 전 §2 절차로 확인 후
   `AIRTABLE_CUSTOMERS_FIELD_MAP` 설정 필요.
2. **중복방지용 Supabase id 필드 부재 가능성** — Airtable에 `Supabase ID` 필드 추가
   권장(§4).
3. **배포 위치** — `customers` 테이블/포털은 dev 환경 기준. 이 Route와 migration은
   해당 Supabase/Vercel 환경에 배포해야 한다.
4. **`status` single select 옵션** — Airtable `상태` 필드가 single select라면
   `pending_plan` 등 실제 옵션값과 일치해야 한다(typecast로 일부 완화).
