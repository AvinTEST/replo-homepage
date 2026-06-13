import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import { encryptedChannelTalkCredentials } from "@/lib/integrations/customerIntegrations";
import { requireAdminClient } from "@/lib/integrations/service";
import { isSameOriginRequest } from "@/lib/security/sameOrigin";
import {
  canManageIntegrations,
  getTenantAuthorization,
} from "@/lib/tenants/auth";

export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const authorization = await getTenantAuthorization(params.tenantId);
  if (!authorization.authenticated) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!authorization.access) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 404 });
  }
  if (!canManageIntegrations(authorization.access)) {
    return NextResponse.json({ error: "연동을 수정할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json()) as { accessKey?: string; accessSecret?: string };
  if (!body.accessKey?.trim() || !body.accessSecret?.trim()) {
    return NextResponse.json({ error: "Access Key와 Access Secret을 입력해 주세요." }, { status: 400 });
  }

  try {
    const connector = new ChannelTalkConnector({
      accessKey: body.accessKey.trim(),
      accessSecret: body.accessSecret.trim(),
    });
    await connector.testConnection();
    const admin = requireAdminClient();
    const credentials = encryptedChannelTalkCredentials(
      body.accessKey.trim(),
      body.accessSecret.trim(),
    );
    const { data: existing, error: existingError } = await admin
      .from("channel_integrations")
      .select("id")
      .eq("tenant_id", params.tenantId)
      .eq("provider", "channel_talk")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    const values = {
      tenant_id: params.tenantId,
      provider: "channel_talk",
      display_name: "채널톡",
      status: "connected",
      encrypted_credentials: null,
      ...credentials,
      last_checked_at: new Date().toISOString(),
      last_sync_status: "연결 테스트 성공",
      last_error: null,
      updated_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await admin.from("channel_integrations").update(values).eq("id", existing.id)
      : await admin.from("channel_integrations").insert(values);
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "채널톡 연결 정보를 안전하게 저장했습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "연결 정보를 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
