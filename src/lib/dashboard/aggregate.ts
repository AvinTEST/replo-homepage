export type DashboardMetricRow = {
  date: string;
  provider: string;
  channel: string;
  task: string;
  count: number;
  answeredCount: number;
  missedCount: number;
  billableCount: number;
  memo?: string;
};

export type SupabaseMetricRow = {
  date_key: string;
  provider: string;
  channel: string;
  task_type: string;
  total_count: number;
  answered_count: number;
  missed_count: number;
  billable_count: number | string;
};

type DashboardTenant = {
  id: string;
  name: string;
  planName: string;
  monthlyPlanLimit: number;
};

type DashboardSync = {
  status: "ok" | "error" | "loading" | "never_synced";
  lastSyncAt: string | null;
  message: string;
};

type Grain = "day" | "week" | "month";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function grainKey(dateValue: string, grain: Grain) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (grain === "month") return dateValue.slice(0, 7);
  if (grain === "week") {
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return isoDate(date);
  }
  return dateValue;
}

function trendLabel(key: string, grain: Grain, rangeStart: string, rangeEnd: string) {
  if (grain === "day") return key.slice(5).replace("-", ".");
  if (grain === "month") return key.replace("-", ".");
  const start = new Date(`${key}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const cappedStart = key < rangeStart ? rangeStart : key;
  const cappedEnd = isoDate(end) > rangeEnd ? rangeEnd : isoDate(end);
  return `${cappedStart.slice(5).replace("-", ".")}~${cappedEnd.slice(5).replace("-", ".")}`;
}

function businessDaysRemaining(referenceDate: string) {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(Date.UTC(year, month, 0));
  let count = 0;
  while (cursor <= end) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function aggregateDashboardMetrics(input: {
  tenant: DashboardTenant;
  grain: Grain;
  start: string;
  end: string;
  referenceDate: string;
  selectedRows: DashboardMetricRow[];
  monthlyRows: DashboardMetricRow[];
  sync: DashboardSync;
}) {
  const channelTotals = new Map<string, number>();
  const taskTotals = new Map<string, number>();
  const dateTotals = new Map<string, number>();
  const callTotals = new Map<string, { answered: number; missed: number }>();
  let total = 0;

  for (const row of input.selectedRows) {
    total += row.count;
    channelTotals.set(row.channel, (channelTotals.get(row.channel) ?? 0) + row.count);
    taskTotals.set(row.task, (taskTotals.get(row.task) ?? 0) + row.count);
    const key = grainKey(row.date, input.grain);
    dateTotals.set(key, (dateTotals.get(key) ?? 0) + row.count);
    if (row.answeredCount || row.missedCount) {
      const calls = callTotals.get(key) ?? { answered: 0, missed: 0 };
      calls.answered += row.answeredCount;
      calls.missed += row.missedCount;
      callTotals.set(key, calls);
    }
  }

  const monthlyGroups = new Map<string, {
    channel: string;
    task: string;
    billableCount: number;
  }>();
  let monthlyUsed = 0;
  for (const row of input.monthlyRows) {
    monthlyUsed += row.billableCount;
    const key = `${row.channel}:${row.task}`;
    const group = monthlyGroups.get(key) ?? {
      channel: row.channel,
      task: row.task,
      billableCount: 0,
    };
    group.billableCount += row.billableCount;
    monthlyGroups.set(key, group);
  }

  const sortedChannels = Array.from(channelTotals.entries()).sort((a, b) => b[1] - a[1]);
  const sortedTasks = Array.from(taskTotals.entries()).sort((a, b) => b[1] - a[1]);
  const trend = Array.from(dateTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      key,
      label: trendLabel(key, input.grain, input.start, input.end),
      count,
    }));
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const diff = (latest?.count ?? 0) - (previous?.count ?? 0);
  const callTrend = trend.map(({ key, label }) => {
    const calls = callTotals.get(key) ?? { answered: 0, missed: 0 };
    const callTotal = calls.answered + calls.missed;
    return {
      key,
      label,
      total: callTotal,
      answered: calls.answered,
      missed: calls.missed,
      rate: callTotal ? Math.round((calls.answered / callTotal) * 1000) / 10 : 0,
    };
  });
  const answeredCalls = callTrend.reduce((sum, item) => sum + item.answered, 0);
  const missedCalls = callTrend.reduce((sum, item) => sum + item.missed, 0);
  const totalCalls = answeredCalls + missedCalls;
  const remaining = input.tenant.monthlyPlanLimit - monthlyUsed;
  const daysLeft = businessDaysRemaining(input.referenceDate);
  const detailRows = Array.from(monthlyGroups.values())
    .map((group) => ({
      channel: group.channel,
      task: group.task,
      count: group.billableCount,
      pct: monthlyUsed ? (group.billableCount / monthlyUsed) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
  const table = input.selectedRows
    .map((row) => ({
      date: row.date,
      channel: row.channel,
      task: row.task,
      count: row.count,
      memo: row.memo,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    tenant: input.tenant,
    range: {
      start: input.start,
      end: input.end,
      grain: input.grain,
      lastDataDate: table[0]?.date ?? null,
    },
    sync: input.sync,
    filters: {
      channels: Array.from(channelTotals.keys()).sort(),
      tasks: Array.from(taskTotals.keys()).sort(),
    },
    planUsage: {
      planLimit: input.tenant.monthlyPlanLimit,
      monthlyUsed,
      remaining,
      usageRate: input.tenant.monthlyPlanLimit
        ? (monthlyUsed / input.tenant.monthlyPlanLimit) * 100
        : 0,
      remainingRate: input.tenant.monthlyPlanLimit
        ? (remaining / input.tenant.monthlyPlanLimit) * 100
        : 0,
      businessDaysLeft: daysLeft,
      dailyNeed: daysLeft ? Math.max(0, Math.ceil(remaining / daysLeft)) : 0,
      detailRows,
    },
    operationKpis: {
      total,
      activeChannels: channelTotals.size,
      topChannel: sortedChannels[0]
        ? { name: sortedChannels[0][0], count: sortedChannels[0][1] }
        : null,
      topTask: sortedTasks[0] ? { name: sortedTasks[0][0], count: sortedTasks[0][1] } : null,
      dayOverDay: {
        diff,
        diffPct: previous?.count ? (diff / previous.count) * 100 : null,
        prevDate: previous?.key ?? null,
        lastDate: latest?.key ?? null,
      },
    },
    callKpis: {
      totalCalls,
      answeredCalls,
      missedCalls,
      answerRate: totalCalls ? (answeredCalls / totalCalls) * 100 : 0,
    },
    charts: {
      trend,
      byChannel: sortedChannels.map(([channel, count]) => ({ channel, count })),
      byTask: sortedTasks.slice(0, 10).map(([task, count]) => ({ task, count })),
      callTrend,
    },
    table,
  };
}

export function mapMetricRows(rows: SupabaseMetricRow[]): DashboardMetricRow[] {
  return rows.map((metric) => ({
    date: metric.date_key,
    provider: metric.provider,
    channel: metric.channel,
    task: metric.task_type,
    count: Number(metric.total_count),
    answeredCount: Number(metric.answered_count),
    missedCount: Number(metric.missed_count),
    billableCount: Number(metric.billable_count),
    memo: "",
  }));
}

export function buildDashboardFromMetricFixtures(input: {
  tenant: DashboardTenant;
  grain: Grain;
  start: string;
  end: string;
  referenceDate: string;
  selectedMetrics: SupabaseMetricRow[];
  monthlyMetrics: SupabaseMetricRow[];
  sync: DashboardSync;
}) {
  return aggregateDashboardMetrics({
    tenant: input.tenant,
    grain: input.grain,
    start: input.start,
    end: input.end,
    referenceDate: input.referenceDate,
    selectedRows: mapMetricRows(input.selectedMetrics),
    monthlyRows: mapMetricRows(input.monthlyMetrics),
    sync: input.sync,
  });
}
