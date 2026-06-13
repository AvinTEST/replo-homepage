import "server-only";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowlist = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  return allowlist.has(email.trim().toLowerCase());
}
