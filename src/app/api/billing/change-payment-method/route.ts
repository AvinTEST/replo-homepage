import { NextResponse } from "next/server";
import {
  configuredRedirectOrigins,
  paymentMethodChangeMode,
  safePaymentRedirect,
} from "@/lib/billing/paymentMethodChange";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { isSameOriginRequest } from "@/lib/security/sameOrigin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const access = await getCurrentCustomerAccess();
  if (!access) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("id, steppay_subscription_id")
    .eq("customer_id", access.customer.id)
    .limit(1)
    .maybeSingle();
  if (subscriptionError) {
    return NextResponse.json(
      { error: "구독 정보를 확인하지 못했습니다." },
      { status: 500 },
    );
  }

  const mode = paymentMethodChangeMode({
    token: process.env.STEPPAY_SECRET_TOKEN,
    apiBaseUrl: process.env.STEPPAY_API_BASE_URL,
    allowedOrigins: process.env.STEPPAY_ALLOWED_REDIRECT_ORIGINS,
    stepPaySubscriptionId: subscription?.steppay_subscription_id,
  });
  const manualMessage = subscription
    ? "결제수단 변경 요청이 접수되었습니다. 운영팀 확인 후 안내드리겠습니다."
    : "아직 구독 정보가 없어 운영팀 상담 요청으로 접수되었습니다.";

  const { error: eventError } = await admin.from("billing_events").insert({
    customer_id: access.customer.id,
    subscription_id: subscription?.id ?? null,
    event_type: "payment_method_change_requested",
    status: mode === "steppay" ? "requested" : "manual_review",
    message:
      mode === "steppay"
        ? "결제수단 변경 요청이 생성되었습니다."
        : manualMessage,
  });
  if (eventError) {
    return NextResponse.json(
      { error: "결제수단 변경 요청을 기록하지 못했습니다." },
      { status: 500 },
    );
  }

  if (mode === "manual" || !subscription?.steppay_subscription_id) {
    return NextResponse.json(
      { ok: true, mode: "manual", message: manualMessage },
      { status: 202 },
    );
  }

  const baseUrl = process.env.STEPPAY_API_BASE_URL!.replace(/\/+$/, "");
  const allowedOrigins = configuredRedirectOrigins(
    process.env.STEPPAY_ALLOWED_REDIRECT_ORIGINS,
  );

  try {
    const response = await fetch(
      `${baseUrl}/${encodeURIComponent(
        subscription.steppay_subscription_id,
      )}/payment-method`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.STEPPAY_SECRET_TOKEN}`,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new Error(`StepPay request failed with status ${response.status}`);
    }

    const body = (await response.json()) as { redirectUrl?: unknown };
    const redirectUrl = safePaymentRedirect(body.redirectUrl, allowedOrigins);
    if (!redirectUrl) {
      throw new Error("StepPay returned an unapproved redirect URL");
    }

    return NextResponse.json({ ok: true, mode: "steppay", redirectUrl });
  } catch (error) {
    console.error(
      "Failed to start StepPay payment method change:",
      error instanceof Error ? error.message : "unknown error",
    );
    await admin.from("billing_events").insert({
      customer_id: access.customer.id,
      subscription_id: subscription.id,
      event_type: "payment_method_change_failed",
      status: "failed",
      message: "외부 결제 페이지 연결에 실패해 운영팀 확인이 필요합니다.",
    });
    return NextResponse.json(
      {
        ok: true,
        mode: "manual",
        message:
          "외부 결제 페이지를 열지 못해 운영팀 확인 요청으로 전환되었습니다.",
      },
      { status: 202 },
    );
  }
}
