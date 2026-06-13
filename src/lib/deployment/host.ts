const PORTAL_LOGIN_HOSTS = new Set(["dev.replo.kr", "localhost", "127.0.0.1"]);

export function shouldShowPortalLogin(host: string | null) {
  const hostname = host?.trim().toLowerCase().split(":")[0] ?? "";
  return PORTAL_LOGIN_HOSTS.has(hostname);
}
