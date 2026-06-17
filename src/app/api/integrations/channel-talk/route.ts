import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  canManageCustomer,
  getCurrentCustomerAccess,
} from "@/lib/customers/access";
import { encryptedChannelTalkCredentials } from "@/lib/integrations/customerIntegrations";
import { createAdminClient } from "@/lib/supabase/admin";

const CONSENT_TYPE = "channel_talk_personal_data_outsourcing";

function value(body: Record<string, unknown>, key: string, max = 200) {
  const item = body[key];
  return typeof item === "string" ? item.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "채널을 연동할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const brandName = value(body, "brandName");
  const channelName = value(body, "channelName");
  const accessKey = value(body, "accessKey", 500);
  const accessSecret = value(body, "accessSecret", 1000);
  if (!brandName || !channelName || !accessKey || !accessSecret) {
    return NextResponse.json(
      { error: "브랜드명, 채널명, Access Key, Access Secret을 모두 입력해 주세요." },
      { status: 400 },
    );
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "개인정보 처리 위탁 내용을 확인하고 동의해 주세요." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("channel_integrations")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", access.customer.id)
    .eq("provider", "channel_talk")
    .eq("status", "connected");
  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: "채널톡 연동은 고객사 기준 최대 10개까지 추가할 수 있습니다." },
      { status: 409 },
    );
  }

  try {
    await new ChannelTalkConnector({ accessKey, accessSecret }).testConnection();
    const { data: brand, error: brandError } = await admin
      .from("brands")
      .upsert(
        {
          customer_id: access.customer.id,
          name: brandName,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "customer_id,name" },
      )
      .select("id")
      .single();
    if (brandError || !brand) throw brandError ?? new Error("브랜드를 만들지 못했습니다.");

    const now = new Date().toISOString();
    const { data: integration, error: integrationError } = await admin
      .from("channel_integrations")
      .insert({
        tenant_id: access.tenantId,
        customer_id: access.customer.id,
        brand_id: brand.id,
        provider: "channel_talk",
        display_name: channelName,
        channel_name: channelName,
        status: "connected",
        ...encryptedChannelTalkCredentials(accessKey, accessSecret),
        last_checked_at: now,
        last_sync_status: "연결 테스트 성공",
        created_by: access.user.id,
        updated_at: now,
      })
      .select("id")
      .single();
    if (integrationError || !integration) throw integrationError ?? new Error("연동 저장 실패");

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const { error: consentError } = await admin.from("integration_consents").insert({
      customer_id: access.customer.id,
      integration_id: integration.id,
      consent_type: CONSENT_TYPE,
      agreed_by: access.user.id,
      ip_address: forwardedFor || null,
    });
    if (consentError) {
      await admin.from("channel_integrations").delete().eq("id", integration.id);
      throw consentError;
    }

    await admin.from("audit_logs").insert({
      customer_id: access.customer.id,
      actor_user_id: access.user.id,
      action: "integration.channel_talk_created",
      target_type: "channel_integration",
      target_id: integration.id,
      metadata: { brand_name: brandName, channel_name: channelName },
    });
    return NextResponse.json({ ok: true, message: "채널톡 연동이 완료되었습니다." });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "채널톡 연결 정보를 저장하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
