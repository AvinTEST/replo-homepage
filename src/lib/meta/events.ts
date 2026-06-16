// Shared Meta (Facebook) event definitions used by both the client Pixel and the
// server Conversions API. This module must stay free of secrets and browser- or
// node-only APIs so it can be imported from either runtime.

// Event names allowed in this live soft-launch. Anything outside this list is
// rejected by the Conversions API route so the internal endpoint cannot be
// abused to emit arbitrary (e.g. purchase-optimisation) events.
export const ALLOWED_EVENT_NAMES = [
  "PageView",
  "Lead",
  "CompleteRegistration",
  "complete_onboarding",
] as const;

export type AllowedEventName = (typeof ALLOWED_EVENT_NAMES)[number];

// Custom (non-standard) events are sent via fbq("trackCustom", ...) on the
// client. Standard events use fbq("track", ...).
export const CUSTOM_EVENT_NAMES = new Set<string>(["complete_onboarding"]);

// Events that must never be emitted during this launch. Kept explicit so the
// server can hard-reject them even if they were ever requested.
export const FORBIDDEN_EVENT_NAMES = new Set<string>([
  "Purchase",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Subscribe",
  "StartTrial",
  "AddToCart",
]);

export function isAllowedEventName(name: string): name is AllowedEventName {
  if (FORBIDDEN_EVENT_NAMES.has(name)) return false;
  return (ALLOWED_EVENT_NAMES as readonly string[]).includes(name);
}

export function isCustomEventName(name: string): boolean {
  return CUSTOM_EVENT_NAMES.has(name);
}

// Generates a stable, unique event id shared by the client Pixel event and the
// server Conversions API event so Meta can deduplicate the pair.
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export type MetaCustomData = Record<string, string | number | boolean | undefined>;

// Identifiers that may be hashed and attached to user_data. Raw values are
// never sent to Meta; the server hashes them with SHA-256.
export type MetaUserIdentifiers = {
  email?: string;
  phone?: string;
};
