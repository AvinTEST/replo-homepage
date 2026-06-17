import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDashboardFromMetricFixtures,
  type SupabaseMetricRow,
} from "@/lib/dashboard/aggregate";
import { calendarMonthRange } from "@/lib/dashboard/dates";
import {
  buildDemoMetricRows,
  DEMO_PLAN_LIMIT,
  DEMO_PLAN_NAME,
} from "@/data/dashboard-demo";
import type { DashboardResponse, Grain } from "@/types/dashboard";

export async function loadPortalTenant(tenantId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .select("id, display_name, plan_name")
    .eq("id", tenantId)
    .single();

  if (error || !data) throw new Error("Tenant not found");

  return {
    id: data.id as string,
    name: (data.display_name as string | null) || "워크스페이스",
    planName: (data.plan_name as string | null) || "미등록",
  };
}

export async function loadDashboard(input: {
  tenantId: string;
  grain: Grain;
  start: string;
  end: string;
  channel?: string;
  task?: string;
}): Promise<DashboardResponse> {
  const admin = createAdminClient();

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

  let selectedMetrics = (metricsResult.data ?? []) as SupabaseMetricRow[];
  let monthlyMetrics = (monthlyMetricsResult.data ?? []) as SupabaseMetricRow[];
  let planName = tenantResult.data.plan_name as string;
  let monthlyPlanLimit = Number(tenantResult.data.monthly_plan_limit);
  let sync = {
    status:
      integration?.status === "connected"
        ? ("ok" as const)
        : integration?.status === "error"
          ? ("error" as const)
          : ("never_synced" as const),
    lastSyncAt: (integration?.last_sync_at as string | null) ?? null,
    message:
      (integration?.last_error as string | null) ??
      (integration?.last_sync_status as string | null) ??
      "아직 동기화된 데이터가 없습니다.",
  };

  // 라이브 런칭 프리뷰: 실데이터가 한 건도 없는 워크스페이스에는
  // dev 대시보드와 동일한 화면이 보이도록 더미 데이터를 채워 줍니다.
  // 실데이터가 들어오면(아래 조건이 false) 자동으로 비활성화됩니다.
  if (selectedMetrics.length === 0 && monthlyMetrics.length === 0) {
    monthlyMetrics = buildDemoMetricRows(month.start, month.end);
    let demoSelected = buildDemoMetricRows(input.start, input.end);
    if (input.channel) {
      demoSelected = demoSelected.filter((row) => row.channel === input.channel);
    }
    if (input.task) {
      demoSelected = demoSelected.filter((row) => row.task_type === input.task);
    }
    selectedMetrics = demoSelected;
    if (!monthlyPlanLimit) monthlyPlanLimit = DEMO_PLAN_LIMIT;
    if (!planName || planName === "Basic") planName = DEMO_PLAN_NAME;
    sync = {
      status: "ok",
      lastSyncAt: `${month.end}T09:00:00+09:00`,
      message: "샘플 데이터로 미리보기 중입니다.",
    };
  }

  return buildDashboardFromMetricFixtures({
    tenant: {
      id: tenantResult.data.id as string,
      name: tenantResult.data.display_name as string,
      planName,
      monthlyPlanLimit,
    },
    grain: input.grain,
    start: input.start,
    end: input.end,
    referenceDate: month.end,
    selectedMetrics,
    monthlyMetrics,
    sync,
  });
}
