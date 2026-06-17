import { NextResponse } from "next/server";
import {
  AirtableConfigurationError,
  createRecord,
  findRecordByField,
  getAirtableConfig,
} from "@/lib/integrations/airtable";
import { isValidBearerSecret } from "@/lib/security/cron";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase Database Webhook payload shape.
// See: https://supabase.com/docs/guides/database/webhooks
type SupabaseWebhookPayload = {
  type?: "INSERT" | "UPDATE" | "DELETE";
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

// Actual public.customers columns (supabase/migrations/202606100001_*).
type CustomerRecord = {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  website_url?: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
};

// ---------------------------------------------------------------------------
// Airtable field mapping
//
// TODO_MAPPING_REVIEW: The Airtable base (appdYCsGtltnVjq5d / tblfEo1KNmQU95WFD)
// already has its own field names and this environment has no Airtable token, so
// the names below are UNVERIFIED best-effort guesses (confidence < 0.8). Confirm
// the real field names per docs/AIRTABLE_INTEGRATION.md §2, then override with the
// AIRTABLE_CUSTOMERS_FIELD_MAP env var (JSON) — no code change required. Sending a
// field name that does not exist in Airtable will fail the record create.
//
// Mapping draft (Supabase column -> Airtable field -> transform -> confidence):
//   company_name -> "회사명"   -> string as-is        -> 0.7
//   contact_name -> "담당자"   -> string as-is        -> 0.6
//   email        -> "이메일"   -> string as-is        -> 0.7
//   phone        -> "연락처"   -> string as-is        -> 0.6
//   website_url  -> "웹사이트" -> string as-is        -> 0.5
//   status       -> "상태"     -> single select value -> 0.4 (option must exist)
//   created_at   -> "가입일"   -> ISO date string     -> 0.5
// ---------------------------------------------------------------------------
const DEFAULT_FIELD_MAP: Record<keyof Omit<CustomerRecord, "id">, string> = {
  company_name: "회사명",
  contact_name: "담당자",
  phone: "연락처",
  website_url: "웹사이트",
  email: "이메일",
  status: "상태",
  created_at: "가입일",
};

function resolveFieldMap(): Record<string, string> {
  const raw = process.env.AIRTABLE_CUSTOMERS_FIELD_MAP;
  if (!raw) return DEFAULT_FIELD_MAP;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return { ...DEFAULT_FIELD_MAP, ...parsed };
  } catch {
    // A typo in the override should not silently drop all mappings; warn and
    // fall back to the documented defaults.
    console.error("[airtable.customers] invalid AIRTABLE_CUSTOMERS_FIELD_MAP JSON");
    return DEFAULT_FIELD_MAP;
  }
}

/**
 * Maps a Supabase customers row to Airtable fields using only configured field
 * names. Empty/missing values are omitted so we never overwrite an Airtable cell
 * with a blank, and single-select-style values are passed through with
 * Airtable's `typecast` enabled (see createRecord) to tolerate exact-option text.
 */
function mapCustomerToAirtableFields(
  record: CustomerRecord,
  fieldMap: Record<string, string>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [column, airtableField] of Object.entries(fieldMap)) {
    if (!airtableField) continue;
    const value = record[column as keyof CustomerRecord];
    if (value === undefined || value === null || value === "") continue;
    fields[airtableField] = value;
  }
  return fields;
}

export async function POST(request: Request) {
  // 1. Authorization. Missing secret config -> 500; bad/absent header -> 401.
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[airtable.customers] SUPABASE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 },
    );
  }
  if (!isValidBearerSecret(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse payload.
  let payload: SupabaseWebhookPayload;
  try {
    payload = (await request.json()) as SupabaseWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // 3. Only react to new customer rows; acknowledge anything else with 200 so
  //    Supabase does not retry events we intentionally ignore.
  if (payload.type !== "INSERT") {
    return NextResponse.json({ ok: true, skipped: true, reason: "Not an INSERT" });
  }
  if (payload.table !== "customers") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Not the customers table",
    });
  }
  if (!payload.record) {
    return NextResponse.json({ error: "Missing record" }, { status: 400 });
  }
  const record = payload.record as CustomerRecord;
  if (!record.id) {
    return NextResponse.json({ error: "Missing record.id" }, { status: 400 });
  }

  // Admin client is optional for the core sync but required for write-back.
  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    // Sync can still proceed without write-back; we warn in the response.
    admin = null;
  }

  try {
    const config = getAirtableConfig();
    const fieldMap = resolveFieldMap();

    // 4. Duplicate prevention.
    //    a) If we already recorded an Airtable id on this customer, skip.
    if (admin) {
      const { data: existing } = await admin
        .from("customers")
        .select("airtable_record_id")
        .eq("id", record.id)
        .maybeSingle();
      if (existing?.airtable_record_id) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "Already synced",
        });
      }
    }

    //    b) If an Airtable field stores the Supabase id, match on it (exact).
    //       Otherwise fall back to email-based dedup.
    //
    //    NOTE: The existing Airtable table may not have a Supabase-id column. Set
    //    AIRTABLE_CUSTOMERS_ID_FIELD to that field's name once it exists (see
    //    docs §7). Email fallback is best-effort and can miss/over-match when a
    //    customer reuses an email — accepted risk, documented in the report.
    const idField = process.env.AIRTABLE_CUSTOMERS_ID_FIELD;
    if (idField) {
      const found = await findRecordByField(config, idField, record.id);
      if (found) {
        if (admin) await writeBack(admin, record.id, found.id);
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "Already synced",
        });
      }
    } else if (record.email && fieldMap.email) {
      const found = await findRecordByField(config, fieldMap.email, record.email);
      if (found) {
        if (admin) await writeBack(admin, record.id, found.id);
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "Already synced (email match)",
        });
      }
    }

    // 5. Build Airtable fields. Refuse to create an empty record.
    const fields = mapCustomerToAirtableFields(record, fieldMap);
    if (idField) fields[idField] = record.id;
    const hasMappedData = Object.keys(fields).some((k) => k !== idField);
    if (!hasMappedData) {
      console.error("[airtable.customers] empty field mapping", {
        customerId: record.id,
      });
      return NextResponse.json(
        { error: "Mapped Airtable fields are empty" },
        { status: 422 },
      );
    }

    // 6. Create the Airtable record.
    let created;
    try {
      created = await createRecord(config, fields);
    } catch (error) {
      const safeError =
        error instanceof Error ? error.message : "Airtable create failed";
      const status =
        (error as { status?: number })?.status ?? "unknown";
      console.error("[airtable.customers] Airtable create failed", {
        status,
        error: safeError,
      });
      if (admin) {
        await admin
          .from("customers")
          .update({ airtable_sync_error: safeError.slice(0, 500) })
          .eq("id", record.id)
          .then(undefined, () => undefined);
      }
      return NextResponse.json({ error: safeError }, { status: 502 });
    }

    // 7. Write back the sync result. Failure here does not invalidate the
    //    successful Airtable create — surface a warning instead.
    let warning: string | undefined;
    if (admin) {
      const { error: updateError } = await writeBack(admin, record.id, created.id);
      if (updateError) {
        warning = "Supabase write-back failed";
        console.error("[airtable.customers] Supabase write-back failed", {
          customerId: record.id,
        });
      }
    } else {
      warning = "Supabase admin client unavailable; sync state not recorded";
    }

    return NextResponse.json({
      ok: true,
      airtableRecordId: created.id,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    const safeError =
      error instanceof Error ? error.message : "Airtable sync failed";
    console.error("[airtable.customers] sync failed", { error: safeError });
    const status = error instanceof AirtableConfigurationError ? 500 : 502;
    return NextResponse.json({ error: safeError }, { status });
  }
}

async function writeBack(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string,
  airtableRecordId: string,
) {
  return admin
    .from("customers")
    .update({
      airtable_record_id: airtableRecordId,
      airtable_synced_at: new Date().toISOString(),
      airtable_sync_error: null,
    })
    .eq("id", customerId);
}
