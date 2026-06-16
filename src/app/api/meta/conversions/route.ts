import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  isAllowedEventName,
  type MetaCustomData,
  type MetaUserIdentifiers,
} from "@/lib/meta/events";

// Internal-use endpoint that forwards a single Meta event to the Conversions
// API. It is intentionally defensive: missing configuration, disallowed event
// names, and upstream failures all resolve without blocking the user flow.
export const runtime = "nodejs";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_TIMEOUT_MS = 5_000;

type ConversionsRequestBody = {
  eventName?: unknown;
  eventId?: unknown;
  eventSourceUrl?: unknown;
  customData?: unknown;
  userData?: unknown;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

function hashPhone(phone: string): string | undefined {
  // Meta expects digits only (with country code where available). Strip
  // everything else before hashing.
  const digits = phone.replace(/[^0-9]/g, "");
  return digits ? sha256(digits) : undefined;
}

function clientIpFromHeaders(headerList: Headers): string | undefined {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip") ?? undefined;
}

function sanitizeCustomData(value: unknown): MetaCustomData | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: MetaCustomData = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (
      typeof raw === "string" ||
      typeof raw === "number" ||
      typeof raw === "boolean"
    ) {
      result[key] = raw;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function readUserIdentifiers(value: unknown): MetaUserIdentifiers {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const identifiers: MetaUserIdentifiers = {};
  if (typeof record.email === "string") identifiers.email = record.email;
  if (typeof record.phone === "string") identifiers.phone = record.phone;
  return identifiers;
}

export async function POST(request: Request) {
  let body: ConversionsRequestBody;
  try {
    body = (await request.json()) as ConversionsRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  // Whitelist enforcement: reject anything outside the allowed launch events so
  // the endpoint cannot be used to emit arbitrary (e.g. purchase) events.
  if (!isAllowedEventName(eventName)) {
    return NextResponse.json({ ok: false, error: "event_not_allowed" }, { status: 400 });
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  // No configuration: safe no-op so the user flow is never blocked.
  if (!pixelId || !accessToken) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  try {
    const headerList = headers();
    const cookieStore = cookies();

    const userData: Record<string, string> = {};
    const clientIp = clientIpFromHeaders(headerList);
    const userAgent = headerList.get("user-agent") ?? undefined;
    if (clientIp) userData.client_ip_address = clientIp;
    if (userAgent) userData.client_user_agent = userAgent;

    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const identifiers = readUserIdentifiers(body.userData);
    if (identifiers.email) {
      const hashed = hashEmail(identifiers.email);
      if (hashed) userData.em = hashed;
    }
    if (identifiers.phone) {
      const hashed = hashPhone(identifiers.phone);
      if (hashed) userData.ph = hashed;
    }

    const eventSourceUrl =
      typeof body.eventSourceUrl === "string" && body.eventSourceUrl
        ? body.eventSourceUrl
        : headerList.get("referer") ?? undefined;

    const eventId =
      typeof body.eventId === "string" && body.eventId ? body.eventId : undefined;
    const customData = sanitizeCustomData(body.customData);

    const event: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: userData,
    };
    if (eventId) event.event_id = eventId;
    if (eventSourceUrl) event.event_source_url = eventSourceUrl;
    if (customData) event.custom_data = customData;

    const requestPayload: Record<string, unknown> = { data: [event] };
    if (testEventCode) requestPayload.test_event_code = testEventCode;

    const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken,
    )}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Do not surface upstream errors to the client flow.
      console.error("Meta Conversions API responded with", response.status);
      return NextResponse.json({ ok: false, error: "upstream_error" }, { status: 202 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Meta Conversions API request failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Never block the user flow on tracking failures.
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 202 });
  }
}
