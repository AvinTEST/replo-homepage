// Thin client-side wrapper around the Facebook Pixel global (fbq). All fbq
// access goes through here so we never sprinkle raw fbq calls across the app and
// so every call safely no-ops when the pixel id is not configured.
import { isCustomEventName, type MetaCustomData } from "./events";

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

export function isPixelEnabled(): boolean {
  return FACEBOOK_PIXEL_ID.length > 0;
}

function callFbq(...args: unknown[]): void {
  if (!isPixelEnabled()) return;
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq(...args);
}

export function pixelPageView(): void {
  callFbq("track", "PageView");
}

// Tracks a standard or custom event. When an eventId is supplied it is passed as
// Meta's eventID so the matching Conversions API event can be deduplicated.
export function pixelTrack(
  name: string,
  customData?: MetaCustomData,
  eventId?: string,
): void {
  const method = isCustomEventName(name) ? "trackCustom" : "track";
  const options = eventId ? { eventID: eventId } : undefined;
  if (customData && options) {
    callFbq(method, name, customData, options);
  } else if (customData) {
    callFbq(method, name, customData);
  } else if (options) {
    callFbq(method, name, {}, options);
  } else {
    callFbq(method, name);
  }
}
