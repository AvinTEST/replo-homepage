import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/integrations/service";
import { syncChannelTalk } from "@/lib/integrations/syncChannelTalk";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = requireAdminClient();
    const { data, error } = await admin
      .from("channel_integrations")
      .select("tenant_id")
      .eq("provider", "channel_talk")
      .eq("status", "connected");
    if (error) throw error;
    const tenantIds = Array.from(new Set((data ?? []).map((row) => row.tenant_id as string)));
    const results = [];
    for (const tenantId of tenantIds) {
      try {
        results.push({ tenantId, ...(await syncChannelTalk(tenantId)) });
      } catch {
        results.push({ tenantId, ok: false });
      }
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "예약 동기화에 실패했습니다." },
      { status: 500 },
    );
  }
}
