import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  channelTalkConnectorFromIntegration,
  getChannelTalkIntegration,
} from "@/lib/integrations/service";
import { canManageIntegrations, getTenantAccess } from "@/lib/tenants/auth";

export async function POST(
  request: Request,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access || !canManageIntegrations(access)) {
    return NextResponse.json({ error: "연동을 테스트할 권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      accessKey?: string;
      accessSecret?: string;
    };
    let connector: ChannelTalkConnector;
    if (body.accessKey && body.accessSecret) {
      connector = new ChannelTalkConnector({
        accessKey: body.accessKey.trim(),
        accessSecret: body.accessSecret.trim(),
      });
    } else {
      const integration = await getChannelTalkIntegration(params.tenantId);
      if (!integration) throw new Error("저장된 credential이 없습니다.");
      connector = channelTalkConnectorFromIntegration(integration);
    }
    return NextResponse.json(await connector.testConnection());
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "연결 테스트에 실패했습니다." },
      { status: 400 },
    );
  }
}
