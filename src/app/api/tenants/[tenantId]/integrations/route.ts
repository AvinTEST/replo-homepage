import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/integrations/service";
import { getTenantAuthorization } from "@/lib/tenants/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { tenantId: string } },
) {
  const authorization = await getTenantAuthorization(params.tenantId);
  if (!authorization.authenticated) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (!authorization.access) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 404 });
  }

  try {
    return NextResponse.json({ integrations: await listIntegrations(params.tenantId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "연동 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
