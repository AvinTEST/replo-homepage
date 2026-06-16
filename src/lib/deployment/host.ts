// Hosts where the customer portal (login/dashboard/mypage) is served. Both the
// production domain and the development domain run the full portal, isolated by
// their environment's Supabase project — so each environment keeps users on its
// own domain. Unknown/preview hosts (e.g. *.vercel.app) stay gated.
const PORTAL_LOGIN_HOSTS = new Set([
  "replo.kr",
  "www.replo.kr",
  "dev.replo.kr",
  "localhost",
  "127.0.0.1",
]);

export function shouldShowPortalLogin(host: string | null) {
  const hostname = host?.trim().toLowerCase().split(":")[0] ?? "";
  return PORTAL_LOGIN_HOSTS.has(hostname);
}
