import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
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
  if (!companyName || !representativeName || !brandName) {
    return NextResponse.json(
      { error: "회사명, 대표 담당자, 브랜드명은 필수입니다." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("customer_members")
    .select("customer_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, customerId: existing.customer_id });

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .insert({
      user_id: user.id,
      company_name: companyName,
      contact_name: representativeName,
      representative_name: representativeName,
      business_number: text(body.businessNumber, 40) || null,
      billing_email: text(body.billingEmail) || user.email,
      website_url: text(body.websiteUrl, 500) || null,
      email: user.email,
      status: "pending_plan",
    })
    .select("id")
    .single();
  if (customerError || !customer) {
    return NextResponse.json({ error: "고객사 정보를 만들지 못했습니다." }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: relatedError } = await admin.from("customer_members").insert({
    customer_id: customer.id,
    user_id: user.id,
    role: "owner",
    status: "active",
    last_seen_at: now,
  });
  if (relatedError) {
    await admin.from("customers").delete().eq("id", customer.id);
    return NextResponse.json({ error: "소유자 권한을 만들지 못했습니다." }, { status: 500 });
  }

  const { error: brandError } = await admin.from("brands").insert({
    customer_id: customer.id,
    name: brandName,
    website_url: text(body.websiteUrl, 500) || null,
    status: "active",
  });
  if (brandError) {
    await admin.from("customers").delete().eq("id", customer.id);
    return NextResponse.json({ error: "브랜드 정보를 만들지 못했습니다." }, { status: 500 });
  }

  await Promise.all([
    admin.from("profiles").upsert(
      {
        user_id: user.id,
        name: representativeName,
        email: user.email,
        avatar_url:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    ),
    admin.from("audit_logs").insert({
      customer_id: customer.id,
      actor_user_id: user.id,
      action: "workspace.created",
      target_type: "customer",
      target_id: customer.id,
      metadata: { brand_name: brandName },
    }),
  ]);

  return NextResponse.json({ ok: true, customerId: customer.id });
}
