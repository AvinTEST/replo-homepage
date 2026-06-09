type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", name, params);
  window.fbq?.("trackCustom", name, params);
}

export function trackLead(params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  window.fbq?.("track", "Lead", params);
}
