import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/integrations/service";
import { getTenantAccess } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  try {
    return NextResponse.json({ integrations: await listIntegrations(params.tenantId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "연동 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
