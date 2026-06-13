import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/integrations/service";
import { syncChannelTalk } from "@/lib/integrations/syncChannelTalk";
import {
  canManageIntegrations,
  getTenantAuthorization,
} from "@/lib/tenants/auth";
import { isSameOriginRequest } from "@/lib/security/sameOrigin";

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
    return NextResponse.json({ error: "동기화 권한이 없습니다." }, { status: 403 });
  }
  try {
    const connected = await listIntegrations(params.tenantId);
    const results = [];
    if (connected.some((item) => item.provider === "channel_talk" && item.status === "connected")) {
      results.push(await syncChannelTalk(params.tenantId));
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "전체 동기화에 실패했습니다." },
      { status: 500 },
    );
  }
}
