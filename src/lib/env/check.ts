export type EnvironmentName = "development" | "preview" | "production";

export type EnvironmentCheck = {
  environment: EnvironmentName;
  errors: string[];
  warnings: string[];
  configured: string[];
};

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INTEGRATION_ENCRYPTION_KEY",
] as const;

function has(env: EnvironmentValues, key: string) {
  return Boolean(env[key]?.trim());
}

function validUrl(value: string | undefined, protocols: string[]) {
  if (!value) return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function environmentName(env: EnvironmentValues): EnvironmentName {
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

export function checkEnvironment(env: EnvironmentValues): EnvironmentCheck {
  const environment = environmentName(env);
  const errors: string[] = [];
  const warnings: string[] = [];
  const configured: string[] = [];

  for (const key of REQUIRED) {
    if (has(env, key)) configured.push(key);
    else errors.push(`${key} is required`);
  }

  if (
    has(env, "NEXT_PUBLIC_SUPABASE_URL") &&
    !validUrl(env.NEXT_PUBLIC_SUPABASE_URL, ["https:"])
  ) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be an https URL");
  }
  if (
    has(env, "NEXT_PUBLIC_SITE_URL") &&
    !validUrl(
      env.NEXT_PUBLIC_SITE_URL,
      environment === "development" ? ["http:", "https:"] : ["https:"],
    )
  ) {
    errors.push(
      `NEXT_PUBLIC_SITE_URL must use ${
        environment === "development" ? "http or https" : "https"
      }`,
    );
  }

  if (environment !== "development") {
    const upstashReady =
      has(env, "UPSTASH_REDIS_REST_URL") &&
      has(env, "UPSTASH_REDIS_REST_TOKEN");
    const kvReady =
      has(env, "KV_REST_API_URL") &&
      has(env, "KV_REST_API_TOKEN");
    if (!upstashReady && !kvReady) {
      errors.push(
        "Preview/Production requires a complete Upstash Redis or Vercel KV credential pair",
      );
    }
  }

  const stepPayValues = [
    has(env, "STEPPAY_SECRET_TOKEN"),
    has(env, "STEPPAY_API_BASE_URL"),
    has(env, "STEPPAY_ALLOWED_REDIRECT_ORIGINS"),
  ];
  const stepPayCount = stepPayValues.filter(Boolean).length;
  if (stepPayCount === 0) {
    warnings.push("StepPay is disabled; payment method changes use manual review");
  } else if (stepPayCount < stepPayValues.length) {
    errors.push("StepPay must be fully configured or fully disabled");
  } else {
    configured.push("StepPay");
  }

  if (!has(env, "CRON_SECRET")) {
    warnings.push("CRON_SECRET is missing; scheduled sync remains disabled");
  }
  if (!has(env, "ADMIN_EMAILS")) {
    warnings.push("ADMIN_EMAILS is missing; the internal admin page remains disabled");
  }

  return { environment, errors, warnings, configured };
}
