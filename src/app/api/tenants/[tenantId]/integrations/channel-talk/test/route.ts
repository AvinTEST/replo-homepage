import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  channelTalkConnectorFromIntegration,
  getChannelTalkIntegration,
  requireAdminClient,
} from "@/lib/integrations/service";
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
    return NextResponse.json({ error: "연동을 테스트할 권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      accessKey?: string;
      accessSecret?: string;
    };
    let connector: ChannelTalkConnector;
    let integrationId: string | null = null;
    if (body.accessKey && body.accessSecret) {
      connector = new ChannelTalkConnector({
        accessKey: body.accessKey.trim(),
        accessSecret: body.accessSecret.trim(),
      });
    } else {
      const integration = await getChannelTalkIntegration(params.tenantId);
      if (!integration) throw new Error("저장된 credential이 없습니다.");
      connector = channelTalkConnectorFromIntegration(integration);
      integrationId = integration.id;
    }
    const result = await connector.testConnection();
    if (integrationId) {
      const checkedAt = new Date().toISOString();
      const { error } = await requireAdminClient()
        .from("channel_integrations")
        .update({
          status: "connected",
          last_checked_at: checkedAt,
          last_error: null,
          updated_at: checkedAt,
        })
        .eq("id", integrationId)
        .eq("tenant_id", params.tenantId);
      if (error) throw error;
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "연결 테스트에 실패했습니다." },
      { status: 400 },
    );
  }
}
