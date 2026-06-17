import "server-only";
import crypto from "node:crypto";

type SendMetaEventInput = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  userData?: Record<string, unknown>;
  request?: Request;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getIp(request?: Request) {
  if (!request) return undefined;
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
}

function getCookie(request: Request | undefined, name: string) {
  if (!request) return undefined;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export async function sendMetaCapiEvent(input: SendMetaEventInput) {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { ok: false, skipped: true, reason: "missing_meta_env" };
  }

  const userData: Record<string, unknown> = {
    client_ip_address: getIp(input.request),
    client_user_agent: input.request?.headers.get("user-agent") ?? undefined,
    fbp: getCookie(input.request, "_fbp"),
    fbc: getCookie(input.request, "_fbc"),
    ...input.userData,
  };

  if (typeof userData.email === "string") {
    userData.em = sha256(userData.email);
    delete userData.email;
  }
  if (typeof userData.phone === "string") {
    const normalizedPhone = userData.phone.replace(/\D/g, "");
    if (normalizedPhone) {
      userData.ph = sha256(normalizedPhone);
    }
    delete userData.phone;
  }

  Object.keys(userData).forEach((key) => {
    if (userData[key] === undefined || userData[key] === "") delete userData[key];
  });

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: input.customData ?? {},
      },
    ],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Meta CAPI event failed", response.status, body.slice(0, 500));
    return { ok: false, skipped: false, status: response.status };
  }

  return { ok: true, skipped: false };
}
