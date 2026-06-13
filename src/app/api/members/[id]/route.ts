import { NextResponse } from "next/server";
import {
  canManageCustomer,
  getCurrentCustomerAccess,
  type CustomerRole,
} from "@/lib/customers/access";
import { isSameOriginRequest } from "@/lib/security/sameOrigin";
import { createAdminClient } from "@/lib/supabase/admin";

const EDITABLE_ROLES: CustomerRole[] = ["owner", "admin", "editor", "viewer"];

async function targetMember(id: string, customerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("customer_members")
    .select("id, user_id, role")
    .eq("id", id)
    .eq("customer_id", customerId)
    .maybeSingle();
  return data;
}

async function ownerCount(customerId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("customer_members")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("role", "owner")
    .eq("status", "active");
  return count ?? 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "멤버 역할을 변경할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { role?: CustomerRole };
  if (!body.role || !EDITABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "올바른 역할을 선택해 주세요." }, { status: 400 });
  }

  const target = await targetMember(params.id, access.customer.id);
  if (!target) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  if (
    access.membership.role !== "owner" &&
    (target.role === "owner" || body.role === "owner" || body.role === "admin")
  ) {
    return NextResponse.json({ error: "owner만 해당 역할을 변경할 수 있습니다." }, { status: 403 });
  }
  if (target.role === "owner" && body.role !== "owner" && (await ownerCount(access.customer.id)) <= 1) {
    return NextResponse.json({ error: "마지막 owner의 역할은 변경할 수 없습니다." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("update_customer_member_role", {
    p_customer_id: access.customer.id,
    p_member_id: target.id,
    p_role: body.role,
  });
  if (error) {
    const status = error.message.includes("last_owner") ? 409 : 500;
    return NextResponse.json({ error: "역할을 변경하지 못했습니다." }, { status });
  }

  await admin.from("audit_logs").insert({
    customer_id: access.customer.id,
    actor_user_id: access.user.id,
    action: "member.role_updated",
    target_type: "customer_member",
    target_id: target.id,
    metadata: { previous_role: target.role, role: body.role },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "멤버를 삭제할 권한이 없습니다." }, { status: 403 });
  }

  const target = await targetMember(params.id, access.customer.id);
  if (!target) return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
  if (target.user_id === access.user.id) {
    return NextResponse.json({ error: "현재 로그인한 계정은 직접 삭제할 수 없습니다." }, { status: 409 });
  }
  if (target.role === "owner" && (access.membership.role !== "owner" || (await ownerCount(access.customer.id)) <= 1)) {
    return NextResponse.json({ error: "해당 owner를 삭제할 수 없습니다." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("delete_customer_member", {
    p_customer_id: access.customer.id,
    p_member_id: target.id,
  });
  if (error) {
    const status = error.message.includes("last_owner") ? 409 : 500;
    return NextResponse.json({ error: "멤버를 삭제하지 못했습니다." }, { status });
  }

  await admin.from("audit_logs").insert({
    customer_id: access.customer.id,
    actor_user_id: access.user.id,
    action: "member.deleted",
    target_type: "customer_member",
    target_id: target.id,
    metadata: { user_id: target.user_id, role: target.role },
  });
  return NextResponse.json({ ok: true });
}
