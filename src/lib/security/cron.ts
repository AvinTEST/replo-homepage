import { createHash, timingSafeEqual } from "crypto";

export function isValidBearerSecret(authorization: string | null, secret: string) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const expectedDigest = createHash("sha256").update(secret).digest();
  const providedDigest = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}
