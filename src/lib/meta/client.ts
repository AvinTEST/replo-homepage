"use client";

import { createMetaEventId } from "./eventIds";

type MetaEventName = "Lead" | "CompleteRegistration" | "complete_onboarding";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export async function trackMetaEvent(
  eventName: MetaEventName,
  options: {
    eventId?: string;
    customData?: Record<string, unknown>;
    userData?: Record<string, unknown>;
  } = {},
) {
  const eventId = options.eventId ?? createMetaEventId(eventName.toLowerCase());
  const customData = options.customData ?? {};

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(
      eventName === "complete_onboarding" ? "trackCustom" : "track",
      eventName,
      customData,
      { eventID: eventId },
    );
  }

  await fetch("/api/meta/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      customData,
      userData: options.userData,
      eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
    }),
    keepalive: true,
  }).catch(() => undefined);

  return eventId;
}
