import "server-only";

const API_BASE = "https://api.airtable.com/v0";

export class AirtableConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AirtableConfigurationError";
  }
}

export class AirtableRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AirtableRequestError";
  }
}

export type AirtableConfig = {
  token: string;
  baseId: string;
  tableId: string;
};

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

/**
 * Reads Airtable connection settings from server-only environment variables.
 * Throws AirtableConfigurationError when any required value is missing so the
 * caller can return a clear 5xx instead of leaking an unhandled exception.
 *
 * AIRTABLE_ACCESS_TOKEN must never be exposed with a NEXT_PUBLIC_ prefix.
 */
export function getAirtableConfig(): AirtableConfig {
  const token = process.env.AIRTABLE_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_CUSTOMERS_TABLE_ID;

  if (!token) {
    throw new AirtableConfigurationError(
      "AIRTABLE_ACCESS_TOKEN is not configured",
    );
  }
  if (!baseId) {
    throw new AirtableConfigurationError("AIRTABLE_BASE_ID is not configured");
  }
  if (!tableId) {
    throw new AirtableConfigurationError(
      "AIRTABLE_CUSTOMERS_TABLE_ID is not configured",
    );
  }

  return { token, baseId, tableId };
}

async function request<T>(
  config: AirtableConfig,
  path: string,
  init: RequestInit,
  attempt = 0,
): Promise<T> {
  const response = await fetch(`${API_BASE}/${config.baseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
      accept: "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (response.status === 429 && attempt < 4) {
    const delay = 500 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return request<T>(config, path, init, attempt + 1);
  }
  if (response.status === 401) {
    throw new AirtableRequestError(
      "Airtable 토큰이 유효하지 않습니다 (401).",
      401,
    );
  }
  if (response.status === 403) {
    throw new AirtableRequestError(
      "Airtable 베이스 접근 권한이 없습니다 (403).",
      403,
    );
  }
  if (!response.ok) {
    // Surface a trimmed body for diagnostics. Never contains our token.
    const detail = await response.text().catch(() => "");
    throw new AirtableRequestError(
      `Airtable API 오류 (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AirtableRequestError("Airtable 응답을 해석할 수 없습니다.");
  }
}

/**
 * Lists up to `maxRecords` existing rows. Intended for one-off field-name
 * discovery during setup (see docs/AIRTABLE_INTEGRATION.md §2), not the hot path.
 */
export async function listRecords(
  config: AirtableConfig,
  maxRecords = 3,
): Promise<AirtableRecord[]> {
  const params = new URLSearchParams({ maxRecords: String(maxRecords) });
  const body = await request<{ records?: AirtableRecord[] }>(
    config,
    `${config.tableId}?${params.toString()}`,
    { method: "GET" },
  );
  return body.records ?? [];
}

/**
 * Looks up an existing record by an exact field-value match, used to avoid
 * creating duplicate rows when a webhook is redelivered. The value is escaped
 * for use inside an Airtable filterByFormula single-quoted string.
 */
export async function findRecordByField(
  config: AirtableConfig,
  field: string,
  value: string,
): Promise<AirtableRecord | null> {
  const escaped = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const params = new URLSearchParams({
    filterByFormula: `{${field}} = '${escaped}'`,
    maxRecords: "1",
  });
  const body = await request<{ records?: AirtableRecord[] }>(
    config,
    `${config.tableId}?${params.toString()}`,
    { method: "GET" },
  );
  return body.records?.[0] ?? null;
}

export async function createRecord(
  config: AirtableConfig,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return request<AirtableRecord>(config, config.tableId, {
    method: "POST",
    body: JSON.stringify({ fields, typecast: true }),
  });
}
