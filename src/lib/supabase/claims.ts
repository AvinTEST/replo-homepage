import "server-only";
import { createClient } from "./server";

export type SessionClaims = {
  userId: string;
  email: string | null;
};

/**
 * Resolves the current user's identity from the access-token claims.
 *
 * Unlike `auth.getUser()`, this verifies the JWT locally when asymmetric
 * signing keys are configured (no round-trip to the Auth server). With legacy
 * symmetric secrets it transparently falls back to a single `getUser()` call,
 * so it is never slower than `getUser()`. The session is already refreshed by
 * the middleware on every request, so the cookie token here is fresh.
 */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    userId: claims.sub as string,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}
