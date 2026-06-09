import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDashboardFromMetricFixtures,
  type SupabaseMetricRow,
} from "@/lib/dashboard/aggregate";
import { calendarMonthRange } from "@/lib/dashboard/dates";
import { createDemoDashboard } from "@/lib/dashboard/demoData";
import type { DashboardResponse, Grain } from "@/types/dashboard";

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
      .select("id, display_name, plan_name, monthly_plan_limit, timezone")
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

  const timezone = (tenantResult.data.timezone as string | null) || "Asia/Seoul";
  const month = calendarMonthRange(timezone);
  const metricColumns =
    "date_key, provider, channel, task_type, total_count, answered_count, missed_count, billable_count";
  let metricsQuery = admin
    .from("daily_operation_metrics")
    .select(metricColumns)
    .eq("tenant_id", input.tenantId)
    .gte("date_key", input.start)
    .lte("date_key", input.end);
  if (input.channel) metricsQuery = metricsQuery.eq("channel", input.channel);
  if (input.task) metricsQuery = metricsQuery.eq("task_type", input.task);
  const monthlyMetricsQuery = admin
    .from("daily_operation_metrics")
    .select(metricColumns)
    .eq("tenant_id", input.tenantId)
    .gte("date_key", month.start)
    .lte("date_key", month.end)
    .order("date_key", { ascending: true });
  const [metricsResult, monthlyMetricsResult] = await Promise.all([
    metricsQuery.order("date_key", { ascending: true }),
    monthlyMetricsQuery,
  ]);
  if (metricsResult.error) throw metricsResult.error;
  if (monthlyMetricsResult.error) throw monthlyMetricsResult.error;
  const integration = integrationsResult.data;

  return buildDashboardFromMetricFixtures({
    tenant: {
      id: tenantResult.data.id as string,
      name: tenantResult.data.display_name as string,
      planName: tenantResult.data.plan_name as string,
      monthlyPlanLimit: Number(tenantResult.data.monthly_plan_limit),
    },
    grain: input.grain,
    start: input.start,
    end: input.end,
    referenceDate: month.end,
    selectedMetrics: (metricsResult.data ?? []) as SupabaseMetricRow[],
    monthlyMetrics: (monthlyMetricsResult.data ?? []) as SupabaseMetricRow[],
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
