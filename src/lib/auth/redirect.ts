const PRODUCTION_SITE_URL = "https://replo.kr";

function isLocalhost(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

export function getAuthCallbackUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      const configuredUrl = new URL(configuredSiteUrl);
      if (process.env.NODE_ENV !== "production" || !isLocalhost(configuredUrl)) {
        return new URL("/auth/callback", configuredUrl).toString();
      }
      console.warn(
        "NEXT_PUBLIC_SITE_URL points to localhost in production. Falling back to https://replo.kr.",
      );
    } catch {
      console.warn("NEXT_PUBLIC_SITE_URL is invalid. Using a safe auth callback fallback.");
    }
  }

  if (process.env.NODE_ENV === "production") {
    return `${PRODUCTION_SITE_URL}/auth/callback`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  return `${PRODUCTION_SITE_URL}/auth/callback`;
}
