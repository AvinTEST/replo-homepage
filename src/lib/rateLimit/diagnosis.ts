import { createHash } from "node:crypto";

const windowMs = 10 * 60 * 1000;
const maxRequests = 5;
const memoryStore = new Map<string, { count: number; resetAt: number }>();
let didWarnAboutMemoryFallback = false;

type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

type RedisConfig = {
  url: string;
  token: string;
};

export class DiagnosisRateLimitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnosisRateLimitConfigurationError";
  }
}

function redisConfig(): RedisConfig | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url && !token) return null;
  if (!url || !token) {
    throw new DiagnosisRateLimitConfigurationError(
      "Diagnosis rate limit Redis URL and token must be configured together",
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    token,
  };
}

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimitKey(request: Request) {
  const digest = createHash("sha256").update(clientIp(request)).digest("hex");
  return `replo:diagnosis:rate-limit:${digest}`;
}

function memoryRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      limited: false,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const count = current.count + 1;
  memoryStore.set(key, { ...current, count });
  return {
    limited: count > maxRequests,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    ),
  };
}

async function redisRateLimit(
  config: RedisConfig,
  key: string,
): Promise<RateLimitResult> {
  const script = [
    "local count = redis.call('INCR', KEYS[1])",
    "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('PTTL', KEYS[1])",
    "return {count, ttl}",
  ].join(" ");
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", script, "1", key, String(windowMs)]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis rate limit request failed with ${response.status}`);
  }

  const body = (await response.json()) as {
    result?: [number | string, number | string];
    error?: string;
  };
  if (body.error || !Array.isArray(body.result)) {
    throw new Error(body.error ?? "Redis rate limit response was invalid");
  }

  const count = Number(body.result[0]);
  const ttl = Number(body.result[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttl)) {
    throw new Error("Redis rate limit counters were invalid");
  }

  return {
    limited: count > maxRequests,
    retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)),
  };
}

export async function checkDiagnosisRateLimit(
  request: Request,
): Promise<RateLimitResult> {
  const key = rateLimitKey(request);
  const config = redisConfig();

  if (config) {
    try {
      return await redisRateLimit(config, key);
    } catch (error) {
      console.error("Diagnosis shared rate limiter failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (process.env.NODE_ENV === "production") {
        throw new DiagnosisRateLimitConfigurationError(
          "Diagnosis shared rate limiter is unavailable",
        );
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new DiagnosisRateLimitConfigurationError(
      "Diagnosis shared rate limiter is not configured",
    );
  }

  if (!didWarnAboutMemoryFallback) {
    didWarnAboutMemoryFallback = true;
    console.warn(
      "Diagnosis rate limiter is using development-only in-memory fallback",
    );
  }
  return memoryRateLimit(key);
}
