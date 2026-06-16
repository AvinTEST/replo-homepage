// Client-side event helper that fires a Meta event through BOTH the browser
// Pixel and the server Conversions API using a single shared event_id, so Meta
// can deduplicate the client/server pair. Tracking never blocks or breaks the
// user flow: the server call is fire-and-forget and all errors are swallowed.
import {
  generateEventId,
  isAllowedEventName,
  isCustomEventName,
  type MetaCustomData,
  type MetaUserIdentifiers,
} from "./events";
import { pixelTrack } from "./pixel";

type TrackEventInput = {
  name: string;
  customData?: MetaCustomData;
  userData?: MetaUserIdentifiers;
};

export function trackEvent({ name, customData, userData }: TrackEventInput): string | null {
  if (!isAllowedEventName(name)) {
    return null;
  }

  const eventId = generateEventId();
  const eventSourceUrl =
    typeof window !== "undefined" ? window.location.href : undefined;

  // 1) Client Pixel event.
  pixelTrack(name, customData, eventId);

  // 2) Server Conversions API event with the SAME event_id (fire-and-forget).
  void sendServerEvent({ name, eventId, eventSourceUrl, customData, userData });

  return eventId;
}

function sendServerEvent(payload: {
  name: string;
  eventId: string;
  eventSourceUrl?: string;
  customData?: MetaCustomData;
  userData?: MetaUserIdentifiers;
}): Promise<void> {
  if (typeof fetch !== "function") return Promise.resolve();

  return fetch("/api/meta/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName: payload.name,
      eventId: payload.eventId,
      eventSourceUrl: payload.eventSourceUrl,
      customData: payload.customData,
      userData: payload.userData,
    }),
    // Allows the request to complete even if the page navigates away (e.g. CTA
    // click that immediately routes to /contact).
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

// ---- Convenience helpers for the events allowed in this launch ----

// B. 상담/문의 CTA 클릭
export function trackConsultationCta(location: string): string | null {
  return trackEvent({
    name: "Lead",
    customData: { content_name: "consultation_cta", location },
  });
}

// C. 회원가입 완료
export function trackSignupComplete(userData?: MetaUserIdentifiers): string | null {
  return trackEvent({
    name: "CompleteRegistration",
    customData: { content_name: "signup" },
    userData,
  });
}

// D. 온보딩 완료 (custom event, deduped via complete_onboarding)
export function trackOnboardingComplete(userData?: MetaUserIdentifiers): string | null {
  return trackEvent({
    name: "complete_onboarding",
    customData: { content_name: "onboarding" },
    userData,
  });
}

// E. 문의 제출
export function trackInquirySubmit(userData?: MetaUserIdentifiers): string | null {
  return trackEvent({
    name: "Lead",
    customData: { content_name: "inquiry_submit" },
    userData,
  });
}

// Re-exported so callers can branch on event kind without importing events.ts.
export { isCustomEventName };
