const PRODUCTION_SITE_URL = "https://replo.kr";
const LOCAL_SITE_URL = "http://localhost:3000";

function isLocalhost(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function normalizeSiteUrl(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const configuredUrl = normalizeSiteUrl(configuredSiteUrl);

  if (configuredUrl) {
    if (process.env.NODE_ENV !== "production" || !isLocalhost(configuredUrl)) {
      return configuredUrl.origin;
    }

    console.warn(
      "NEXT_PUBLIC_SITE_URL points to localhost in a production build. Using the current deployment origin.",
    );
  } else if (configuredSiteUrl) {
    console.warn("NEXT_PUBLIC_SITE_URL is invalid. Using the current deployment origin.");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const vercelUrl = normalizeSiteUrl(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  );

  if (vercelUrl) {
    return vercelUrl.origin;
  }

  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}

export function getAuthCallbackUrl() {
  return new URL("/auth/callback", getSiteUrl()).toString();
}
