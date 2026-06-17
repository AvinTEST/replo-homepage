import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/integrations/service";
import { syncChannelTalk } from "@/lib/integrations/syncChannelTalk";
import { canManageIntegrations, getTenantAccess } from "@/lib/tenants/auth";

export async function POST(
  _request: Request,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access || !canManageIntegrations(access)) {
    return NextResponse.json({ error: "동기화 권한이 없습니다." }, { status: 403 });
  }
  try {
    const connected = (await listIntegrations(params.tenantId)).filter(
      (item) => item.provider === "channel_talk" && item.status === "connected",
    );
    const results = [];
    for (const integration of connected) {
      results.push(await syncChannelTalk(params.tenantId, integration.id));
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "전체 동기화에 실패했습니다." },
      { status: 500 },
    );
  }
}
