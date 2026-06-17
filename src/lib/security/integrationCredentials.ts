import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";

function encryptionKey() {
  const source = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!source) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  }
  return createHash("sha256").update(source).digest();
}

export function encryptCredentials(credentials: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptCredentials(value: string) {
  const [version, ivPart, tagPart, encryptedPart] = value.split(".");
  if (version !== VERSION || !ivPart || !tagPart || !encryptedPart) {
    throw new Error("Unsupported encrypted credential format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as Record<string, string>;
}

export function encryptCredentialValue(value: string) {
  return encryptCredentials({ value });
}

export function decryptCredentialValue(value: string) {
  const decrypted = decryptCredentials(value);
  if (typeof decrypted.value !== "string") {
    throw new Error("Encrypted credential value is invalid");
  }
  return decrypted.value;
}
