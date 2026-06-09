import { NextResponse } from "next/server";
import { syncChannelTalk } from "@/lib/integrations/syncChannelTalk";
import { canManageIntegrations, getTenantAccess } from "@/lib/tenants/auth";

export async function POST(
  _request: Request,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access || !canManageIntegrations(access) || access.demo) {
    return NextResponse.json({ error: "동기화 권한이 없습니다." }, { status: 403 });
  }
  try {
    return NextResponse.json(await syncChannelTalk(params.tenantId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "동기화에 실패했습니다." },
      { status: 500 },
    );
  }
}
