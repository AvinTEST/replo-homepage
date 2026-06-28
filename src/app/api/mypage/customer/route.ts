import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentWorkspaceAccess } from "@/lib/workspaces/access";
import { createAdminClient } from "@/lib/supabase/admin";

function text(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalUrl(value: unknown) {
  const input = text(value, 500);
  if (!input) return "";
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function PATCH(request: Request) {
  const access = await getCurrentWorkspaceAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageWorkspace(access)) {
    return NextResponse.json({ error: "고객 정보를 수정할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const companyName = text(body.companyName);
  const brandName = text(body.brandName);
  const representativeName = text(body.representativeName);
  const contactName = text(body.contactName);
  const email = text(body.email).toLowerCase();
  const billingEmail = text(body.billingEmail).toLowerCase();
  const phone = text(body.phone, 40);
  const businessNumber = text(body.businessNumber, 40);
  const websiteUrl = optionalUrl(body.websiteUrl);

  if (!companyName || !brandName || !representativeName || !email) {
    return NextResponse.json(
      { error: "회사명, 브랜드명, 대표 담당자, 고객 연락 이메일은 필수입니다." },
      { status: 400 },
    );
  }
  if (!validEmail(email) || (billingEmail && !validEmail(billingEmail))) {
    return NextResponse.json({ error: "이메일 형식을 확인해 주세요." }, { status: 400 });
  }
  if (websiteUrl === null) {
    return NextResponse.json(
      { error: "웹사이트 주소는 http:// 또는 https://로 입력해 주세요." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [workspaceResult, brandLookup] = await Promise.all([
    admin
      .from("workspaces")
      .update({
        company_name: companyName,
        representative_name: representativeName,
        contact_name: contactName || representativeName,
        email,
        phone: phone || null,
        website_url: websiteUrl || null,
        business_number: businessNumber || null,
        billing_email: billingEmail || email,
        updated_at: now,
      })
      .eq("id", access.workspace.id),
    admin
      .from("brands")
      .select("id")
      .eq("workspace_id", access.workspace.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  const workspaceError = workspaceResult.error;
  if (workspaceError) {
    return NextResponse.json({ error: "고객 정보를 저장하지 못했습니다." }, { status: 500 });
  }

  if (brandLookup.error) {
    return NextResponse.json({ error: "브랜드 정보를 확인하지 못했습니다." }, { status: 500 });
  }
  const brand = brandLookup.data;
  const brandRequest = brand
    ? admin
        .from("brands")
        .update({ name: brandName, website_url: websiteUrl || null, updated_at: now })
        .eq("id", brand.id)
    : admin.from("brands").insert({
        workspace_id: access.workspace.id,
        name: brandName,
        website_url: websiteUrl || null,
      });
  const [brandResult] = await Promise.all([
    brandRequest,
    admin.from("audit_logs").insert({
      workspace_id: access.workspace.id,
      actor_user_id: access.user.id,
      action: "customer.profile_updated",
      target_type: "customer",
      target_id: access.workspace.id,
      metadata: { company_name: companyName, brand_name: brandName },
    }),
  ]);
  if (brandResult.error) {
    return NextResponse.json({ error: "브랜드 정보를 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "고객 정보를 저장했습니다." });
}
