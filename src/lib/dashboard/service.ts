import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { aggregateDashboard, createDemoDashboard } from "@/lib/dashboard/demoData";
import type { DashboardResponse, Grain } from "@/types/dashboard";

type MetricRow = {
  date_key: string;
  channel: string;
  task_type: string;
  total_count: number;
};

export async function loadDashboard(input: {
  tenantId: string;
  grain: Grain;
  start: string;
  end: string;
  channel?: string;
  task?: string;
}): Promise<DashboardResponse> {
  if (input.tenantId === "demo") {
    return createDemoDashboard(input.grain, input.start, input.end, input.channel, input.task);
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  const [tenantResult, integrationsResult] = await Promise.all([
    admin
      .from("tenants")
      .select("id, display_name, plan_name, monthly_plan_limit")
      .eq("id", input.tenantId)
      .single(),
    admin
      .from("channel_integrations")
      .select("status, last_sync_at, last_sync_status, last_error")
      .eq("tenant_id", input.tenantId)
      .order("last_sync_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tenantResult.error || !tenantResult.data) throw new Error("Tenant not found");

  let metricsQuery = admin
    .from("daily_operation_metrics")
    .select("date_key, channel, task_type, total_count")
    .eq("tenant_id", input.tenantId)
    .gte("date_key", input.start)
    .lte("date_key", input.end);
  if (input.channel) metricsQuery = metricsQuery.eq("channel", input.channel);
  if (input.task) metricsQuery = metricsQuery.eq("task_type", input.task);
  const metricsResult = await metricsQuery.order("date_key", { ascending: true });
  if (metricsResult.error) throw metricsResult.error;

  const rows = ((metricsResult.data ?? []) as MetricRow[]).map((metric) => ({
    date: metric.date_key,
    channel: metric.channel,
    task: metric.task_type,
    count: Number(metric.total_count),
    memo: "",
  }));
  const integration = integrationsResult.data;

  return aggregateDashboard({
    tenant: {
      id: tenantResult.data.id as string,
      name: tenantResult.data.display_name as string,
      planName: tenantResult.data.plan_name as string,
      monthlyPlanLimit: Number(tenantResult.data.monthly_plan_limit),
    },
    grain: input.grain,
    start: input.start,
    end: input.end,
    rows,
    sync: {
      status:
        integration?.status === "connected"
          ? "ok"
          : integration?.status === "error"
            ? "error"
            : "never_synced",
      lastSyncAt: (integration?.last_sync_at as string | null) ?? null,
      message:
        (integration?.last_error as string | null) ??
        (integration?.last_sync_status as string | null) ??
        "아직 동기화된 데이터가 없습니다.",
    },
  });
}
