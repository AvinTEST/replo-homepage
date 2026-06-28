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

export async function loadPortalTenant(workspaceId: string) {
  const admin = createAdminClient();
  const [{ data: customer, error }, { data: subscription }] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, company_name")
      .eq("id", workspaceId)
      .single(),
    admin
      .from("subscriptions")
      .select("plan_name")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error || !customer) throw new Error("Customer not found");

  return {
    id: customer.id as string,
    name: (customer.company_name as string | null) || "워크스페이스",
    planName: (subscription?.plan_name as string | null) || "미등록",
  };
}

export async function loadDashboard(input: {
  workspaceId: string;
  grain: Grain;
  start: string;
  end: string;
  channel?: string;
  task?: string;
}): Promise<DashboardResponse> {
  const admin = createAdminClient();

  const [workspaceResult, subscriptionResult, integrationsResult] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, company_name, timezone")
      .eq("id", input.workspaceId)
      .single(),
    admin
      .from("subscriptions")
      .select("plan_name, included_tickets")
      .eq("workspace_id", input.workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("channel_integrations")
      .select("status, last_sync_at, last_sync_status, last_error")
      .eq("workspace_id", input.workspaceId)
      .order("last_sync_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (workspaceResult.error || !workspaceResult.data) throw new Error("Customer not found");

  const timezone = (workspaceResult.data.timezone as string | null) || "Asia/Seoul";
  const month = calendarMonthRange(timezone);
  const metricColumns =
    "date_key, provider, channel, task_type, total_count, answered_count, missed_count, billable_count";
  let metricsQuery = admin
    .from("daily_operation_metrics")
    .select(metricColumns)
    .eq("workspace_id", input.workspaceId)
    .gte("date_key", input.start)
    .lte("date_key", input.end);
  if (input.channel) metricsQuery = metricsQuery.eq("channel", input.channel);
  if (input.task) metricsQuery = metricsQuery.eq("task_type", input.task);
  const monthlyMetricsQuery = admin
    .from("daily_operation_metrics")
    .select(metricColumns)
    .eq("workspace_id", input.workspaceId)
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
  let planName = (subscriptionResult.data?.plan_name as string | null) || "미등록";
  let monthlyPlanLimit = Number(subscriptionResult.data?.included_tickets ?? 0);
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
      id: workspaceResult.data.id as string,
      name: workspaceResult.data.company_name as string,
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
