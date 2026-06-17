import { NextResponse } from "next/server";
import { findSelectablePlan } from "@/lib/billing/plans";
import { canManageCustomer, getCurrentCustomerAccess } from "@/lib/customers/access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "플랜을 변경할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { planId?: string };
  const plan = findSelectablePlan(body.planId);
  if (!plan) {
    return NextResponse.json({ error: "선택할 수 없는 플랜입니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id, plan_name")
    .eq("customer_id", access.customer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionValues = {
    plan_name: plan.id,
    monthly_fee: plan.monthlyFee,
    included_tickets: plan.includedTickets,
    status: "active",
  };
  const subscriptionResult = subscription
    ? await admin.from("subscriptions").update(subscriptionValues).eq("id", subscription.id)
    : await admin.from("subscriptions").insert({
        customer_id: access.customer.id,
        ...subscriptionValues,
      });
  if (subscriptionResult.error) {
    return NextResponse.json({ error: "플랜을 저장하지 못했습니다." }, { status: 500 });
  }

  const now = new Date().toISOString();
  const [tenantResult] = await Promise.all([
    admin
      .from("tenants")
      .update({
        plan_name: plan.id,
        monthly_plan_limit: plan.includedTickets,
        updated_at: now,
      })
      .eq("id", access.tenantId),
    admin
      .from("customers")
      .update({ status: "active", updated_at: now })
      .eq("id", access.customer.id),
    admin.from("audit_logs").insert({
      customer_id: access.customer.id,
      actor_user_id: access.user.id,
      action: "subscription.plan_updated",
      target_type: "subscription",
      target_id: subscription?.id ?? null,
      metadata: { previous_plan: subscription?.plan_name ?? null, plan: plan.id },
    }),
  ]);
  const tenantError = tenantResult.error;
  if (tenantError) {
    return NextResponse.json({ error: "대시보드 플랜 정보를 갱신하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `${plan.label} 플랜을 등록했습니다.`,
    plan,
  });
}
