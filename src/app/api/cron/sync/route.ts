import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/integrations/service";
import { syncChannelTalk } from "@/lib/integrations/syncChannelTalk";
import { validSyncTargets } from "@/lib/integrations/syncTargets";
import { isValidBearerSecret } from "@/lib/security/cron";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isValidBearerSecret(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = requireAdminClient();
    const { data, error } = await admin
      .from("channel_integrations")
      .select("id, tenant_id")
      .eq("provider", "channel_talk")
      .eq("status", "connected");
    if (error) throw error;
    const targets = validSyncTargets(data ?? []);
    const results = [];
    for (const target of targets) {
      try {
        results.push({
          ...target,
          ...(await syncChannelTalk(target.tenantId, target.integrationId)),
        });
      } catch {
        results.push({ ...target, ok: false });
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
