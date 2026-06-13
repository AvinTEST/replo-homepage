export type PaymentMethodChangeMode = "manual" | "steppay";

export function configuredRedirectOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      try {
        const url = new URL(origin);
        return url.protocol === "https:" && url.origin === origin ? [origin] : [];
      } catch {
        return [];
      }
    });
}

export function paymentMethodChangeMode(input: {
  token?: string;
  apiBaseUrl?: string;
  allowedOrigins?: string;
  stepPaySubscriptionId?: string | null;
}): PaymentMethodChangeMode {
  return input.token?.trim() &&
    input.apiBaseUrl?.trim() &&
    configuredRedirectOrigins(input.allowedOrigins).length > 0 &&
    input.stepPaySubscriptionId?.trim()
    ? "steppay"
    : "manual";
}

export function safePaymentRedirect(
  value: unknown,
  allowedOrigins: string[],
) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !allowedOrigins.includes(url.origin)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
