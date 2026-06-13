const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return HTTP_PROTOCOLS.has(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

function allowedOrigins(request: Request) {
  const origins = new Set<string>();
  origins.add(new URL(request.url).origin);

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    const forwarded = normalizedOrigin(`${forwardedProto}://${forwardedHost}`);
    if (forwarded) origins.add(forwarded);
  }

  return origins;
}

export function isSameOriginRequest(request: Request) {
  const candidate =
    normalizedOrigin(request.headers.get("origin")) ??
    normalizedOrigin(request.headers.get("referer"));

  return candidate !== null && allowedOrigins(request).has(candidate);
}
