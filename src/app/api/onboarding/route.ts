import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeWebsiteUrl(value: unknown) {
  const raw = text(value, 500);
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const companyName = text(body.companyName);
  const representativeName = text(body.representativeName);
  const brandName = text(body.brandName);
  const phone = text(body.phone, 40);
  const websiteUrl = normalizeWebsiteUrl(body.websiteUrl);
  if (!companyName || !representativeName || !brandName) {
    return NextResponse.json(
      { error: "회사명, 대표 담당자, 브랜드명은 필수입니다." },
      { status: 400 },
    );
  }
  if (websiteUrl === null) {
    return NextResponse.json(
      { error: "브랜드 홈페이지 URL을 입력해 주세요. 예: https://replo.kr" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, workspaceId: existing.workspace_id });

  const { data, error } = await admin.rpc("initialize_workspace", {
    p_user_id: user.id,
    p_email: user.email,
    p_company_name: companyName,
    p_representative_name: representativeName,
    p_brand_name: brandName,
    p_business_number: "",
    p_billing_email: text(body.billingEmail) || user.email,
    p_website_url: websiteUrl || "",
    p_avatar_url:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : "",
  });
  const workspace = Array.isArray(data) ? data[0] : data;
  if (error || !workspace?.workspace_id) {
    return NextResponse.json({ error: "고객사 정보를 만들지 못했습니다." }, { status: 500 });
  }

  if (phone) {
    await admin.from("workspaces").update({ phone }).eq("id", workspace.workspace_id);
  }

  return NextResponse.json({
    ok: true,
    workspaceId: workspace.workspace_id,
  });
}
