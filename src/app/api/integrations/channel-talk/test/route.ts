import { NextResponse } from "next/server";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  canManageCustomer,
  getCurrentCustomerAccess,
} from "@/lib/customers/access";
import {
  connectorFromStoredIntegration,
  getCustomerIntegration,
} from "@/lib/integrations/customerIntegrations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const access = await getCurrentCustomerAccess();
  if (!access) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!canManageCustomer(access)) {
    return NextResponse.json({ error: "연동을 테스트할 권한이 없습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    integrationId?: string;
    accessKey?: string;
    accessSecret?: string;
  };
  try {
    let connector: ChannelTalkConnector;
    let integrationId: string | null = null;
    if (body.integrationId) {
      const integration = await getCustomerIntegration(access.customer.id, body.integrationId);
      if (!integration) {
        return NextResponse.json({ error: "연동 정보를 찾을 수 없습니다." }, { status: 404 });
      }
      connector = connectorFromStoredIntegration(integration);
      integrationId = integration.id;
    } else if (body.accessKey?.trim() && body.accessSecret?.trim()) {
      connector = new ChannelTalkConnector({
        accessKey: body.accessKey.trim(),
        accessSecret: body.accessSecret.trim(),
      });
    } else {
      return NextResponse.json(
        { error: "테스트할 인증 정보를 입력해 주세요." },
        { status: 400 },
      );
    }

    const result = await connector.testConnection();
    if (integrationId) {
      const admin = createAdminClient();
      await admin
        .from("channel_integrations")
        .update({
          status: "connected",
          last_checked_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integrationId);
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "연결 테스트에 실패했습니다." },
      { status: 400 },
    );
  }
}
