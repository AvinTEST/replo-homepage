import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import { requireAdminClient } from "@/lib/integrations/service";
import { encryptCredentials } from "@/lib/security/integrationCredentials";
import { canManageIntegrations, getTenantAccess } from "@/lib/tenants/auth";

export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access || !canManageIntegrations(access) || access.demo) {
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
    const { error } = await admin.from("channel_integrations").upsert(
      {
        tenant_id: params.tenantId,
        provider: "channel_talk",
        display_name: "채널톡",
        status: "connected",
        encrypted_credentials: encryptCredentials({
          accessKey: body.accessKey.trim(),
          accessSecret: body.accessSecret.trim(),
        }),
        last_sync_status: "연결 테스트 성공",
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,provider" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "채널톡 연결 정보를 안전하게 저장했습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "연결 정보를 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
