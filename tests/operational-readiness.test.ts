import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredRedirectOrigins,
  paymentMethodChangeMode,
  safePaymentRedirect,
} from "../src/lib/billing/paymentMethodChange.ts";
import { checkEnvironment } from "../src/lib/env/check.ts";
import { isSameOriginRequest } from "../src/lib/security/sameOrigin.ts";

test("payment method changes use manual review when StepPay is disabled", () => {
  assert.equal(paymentMethodChangeMode({}), "manual");
  assert.equal(
    paymentMethodChangeMode({
      token: "token",
      apiBaseUrl: "https://api.example.com",
      allowedOrigins: "https://checkout.example.com",
      stepPaySubscriptionId: null,
    }),
    "manual",
  );
});

test("StepPay mode requires complete configuration and a subscription id", () => {
  assert.equal(
    paymentMethodChangeMode({
      token: "token",
      apiBaseUrl: "https://api.example.com",
      allowedOrigins: "https://checkout.example.com",
      stepPaySubscriptionId: "sub_123",
    }),
    "steppay",
  );
});

test("payment redirects only allow exact configured https origins", () => {
  const origins = configuredRedirectOrigins(
    "https://checkout.example.com,http://insecure.example.com,not-a-url",
  );
  assert.deepEqual(origins, ["https://checkout.example.com"]);
  assert.equal(
    safePaymentRedirect(
      "https://checkout.example.com/change?id=1",
      origins,
    ),
    "https://checkout.example.com/change?id=1",
  );
  assert.equal(
    safePaymentRedirect("https://checkout.example.com.evil.test/change", origins),
    null,
  );
});

test("environment checker requires shared Redis outside development", () => {
  const base = {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SITE_URL: "https://dev.replo.kr",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    INTEGRATION_ENCRYPTION_KEY: "encryption",
    VERCEL_ENV: "preview",
  };
  const missingRedis = checkEnvironment(base);
  assert.equal(
    missingRedis.errors.some((message) => message.includes("Redis")),
    true,
  );

  const ready = checkEnvironment({
    ...base,
    UPSTASH_REDIS_REST_URL: "https://redis.example.com",
    UPSTASH_REDIS_REST_TOKEN: "token",
  });
  assert.deepEqual(ready.errors, []);
  assert.equal(
    ready.warnings.some((message) => message.includes("StepPay is disabled")),
    true,
  );
});

test("state-changing requests require an allowed Origin or Referer", () => {
  const sameOrigin = new Request("https://dev.replo.kr/api/onboarding", {
    method: "POST",
    headers: { origin: "https://dev.replo.kr" },
  });
  const crossOrigin = new Request("https://dev.replo.kr/api/onboarding", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  const missingOrigin = new Request("https://dev.replo.kr/api/onboarding", {
    method: "POST",
  });

  assert.equal(isSameOriginRequest(sameOrigin), true);
  assert.equal(isSameOriginRequest(crossOrigin), false);
  assert.equal(isSameOriginRequest(missingOrigin), false);
});
