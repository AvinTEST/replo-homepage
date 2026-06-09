import { NextRequest, NextResponse } from "next/server";
import { defaultRange, validDate } from "@/lib/dashboard/dates";
import { loadDashboard } from "@/lib/dashboard/service";
import { getTenantAccess } from "@/lib/tenants/auth";
import type { Grain } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const access = await getTenantAccess(params.tenantId);
  if (!access) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  const grainValue = request.nextUrl.searchParams.get("grain");
  const grain: Grain =
    grainValue === "week" || grainValue === "month" ? grainValue : "day";
  const fallback = defaultRange(grain);
  const start = validDate(request.nextUrl.searchParams.get("start")) ?? fallback.start;
  const end = validDate(request.nextUrl.searchParams.get("end")) ?? fallback.end;
  if (start > end) {
    return NextResponse.json({ error: "시작일은 종료일보다 빠르게 설정해 주세요." }, { status: 400 });
  }

  try {
    const data = await loadDashboard({
      tenantId: params.tenantId,
      grain,
      start,
      end,
      channel: request.nextUrl.searchParams.get("channel") || undefined,
      task: request.nextUrl.searchParams.get("task") || undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "대시보드 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
