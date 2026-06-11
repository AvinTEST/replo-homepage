import { NextResponse } from "next/server";
import { getCurrentCustomerAccess } from "@/lib/customers/access";
import { createClient } from "@/lib/supabase/server";

function allowedRedirectOrigins() {
  return (process.env.STEPPAY_ALLOWED_REDIRECT_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function safeRedirectUrl(value: unknown) {
  if (typeof value !== "string" || !value) return "/mypage";
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "/mypage";
    if (!allowedRedirectOrigins().includes(url.origin)) return "/mypage";
    return url.toString();
  } catch {
    return "/mypage";
  }
}

/**
 * API handler for initiating a payment method change.
 *
 * This route requires the user to be authenticated. It logs an event in
 * the billing_events table and returns a redirect URL. When integrating
 * StepPay, replace the redirect URL logic with a call to StepPay's API.
 */
export async function POST() {
  const access = await getCurrentCustomerAccess();
  if (!access) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  const { customer } = access;
  const supabase = await createClient();

  // Find the subscription so we know which StepPay subscription to update
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, steppay_subscription_id")
    .eq("customer_id", customer.id)
    .single();
  if (!subscription) {
    return NextResponse.json(
      { error: "구독 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // Log an event so that we can track the status of this request
  await supabase.from("billing_events").insert({
    customer_id: customer.id,
    subscription_id: subscription.id,
    event_type: "payment_method_change_requested",
    status: "requested",
    message: "결제수단 변경 요청이 생성되었습니다.",
  });

  // StepPay 결제수단 변경 요청을 생성합니다. 이 API는 StepPay 고객 ID와 구독 ID를 이용해
  // 결제수단 변경 URL을 반환합니다. 서버에서만 토큰을 사용해야 하므로 환경변수에
  // STEPPAY_SECRET_TOKEN을 설정해 주어야 합니다. API 명세에 맞추어 URL이나
  // 요청 파라미터를 수정하십시오.

  // StepPay API 엔드포인트. 필요한 경우 버전이나 경로를 수정하세요.
  const steppayEndpoint =
    process.env.STEPPAY_API_BASE_URL ??
    "https://api.steppay.io/v1/subscriptions";

  try {
    // 토큰이 없으면 오류를 반환합니다.
    const token = process.env.STEPPAY_SECRET_TOKEN;
    if (!token) {
      throw new Error(
        "STEPPAY_SECRET_TOKEN 환경변수가 설정되어 있지 않습니다."
      );
    }
    // StepPay API 호출: 구독 ID로 결제수단 변경 URL을 요청합니다.
    const response = await fetch(
      `${steppayEndpoint}/${subscription.steppay_subscription_id}/payment-method`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // 필요에 따라 추가 필드를 전달할 수 있습니다.
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `StepPay API error: ${response.status} ${response.statusText}`,
        errorBody
      );
      throw new Error("StepPay API 호출에 실패했습니다.");
    }

    const data = await response.json();
    // StepPay는 결제수단 변경을 위한 리다이렉션 URL을 반환해야 합니다.
    const redirectUrl = safeRedirectUrl(data?.redirectUrl);
    return NextResponse.json({ ok: true, redirectUrl });
  } catch (error) {
    console.error(error);
    // 오류가 발생하면 내부 구성 정보는 숨기고 일반화된 메시지만 반환합니다.
    return NextResponse.json(
      {
        error: "결제수단 변경 요청에 실패했습니다.",
        redirectUrl: "/mypage",
      },
      { status: 500 }
    );
  }
}
