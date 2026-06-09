import { businessDaysLeft, defaultRange, grainKey, isoDate } from "@/lib/dashboard/dates";
import type { DashboardResponse, Grain } from "@/types/dashboard";

const channels = [
  ["채널톡", "채팅"],
  ["채널톡", "전화 - 인바운드"],
  ["스마트스토어센터", "문의 관리"],
  ["쿠팡", "고객 문의"],
  ["어드민패널", "AS 교환"],
] as const;

export function createDemoDashboard(
  grain: Grain,
  start?: string,
  end?: string,
  channelFilter?: string,
  taskFilter?: string,
): DashboardResponse {
  const fallback = defaultRange(grain);
  const rangeStart = start ?? fallback.start;
  const rangeEnd = end ?? fallback.end;
  const rows: DashboardResponse["table"] = [];
  const cursor = new Date(`${rangeStart}T00:00:00Z`);
  const last = new Date(`${rangeEnd}T00:00:00Z`);
  let dayIndex = 0;

  while (cursor <= last) {
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) {
      channels.forEach(([channel, task], index) => {
        const count = 8 + ((dayIndex * 7 + index * 11) % 36);
        if ((!channelFilter || channel === channelFilter) && (!taskFilter || task === taskFilter)) {
          rows.push({
            date: isoDate(cursor),
            channel,
            task,
            count,
            memo: index === 1 && dayIndex % 6 === 0 ? "캠페인 유입 증가" : "",
          });
        }
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    dayIndex += 1;
  }

  return aggregateDashboard({
    tenant: {
      id: "demo",
      name: "Replo 데모 고객사",
      planName: "Enterprise Plan",
      monthlyPlanLimit: 5000,
    },
    grain,
    start: rangeStart,
    end: rangeEnd,
    rows,
    sync: {
      status: "ok",
      lastSyncAt: new Date().toISOString(),
      message: "더미 데이터로 미리보기 중",
    },
  });
}

export function aggregateDashboard(input: {
  tenant: DashboardResponse["tenant"];
  grain: Grain;
  start: string;
  end: string;
  rows: DashboardResponse["table"];
  sync: DashboardResponse["sync"];
}) {
  const channelTotals = new Map<string, number>();
  const taskTotals = new Map<string, number>();
  const dateTotals = new Map<string, number>();
  const callTotals = new Map<string, { total: number; answered: number }>();
  let total = 0;

  for (const row of input.rows) {
    total += row.count;
    channelTotals.set(row.channel, (channelTotals.get(row.channel) ?? 0) + row.count);
    taskTotals.set(row.task, (taskTotals.get(row.task) ?? 0) + row.count);
    const key = grainKey(row.date, input.grain);
    dateTotals.set(key, (dateTotals.get(key) ?? 0) + row.count);
    if (row.task === "전화 - 인바운드") {
      const current = callTotals.get(key) ?? { total: 0, answered: 0 };
      current.total += row.count;
      current.answered += Math.round(row.count * (0.82 + (row.date.charCodeAt(9) % 10) / 100));
      callTotals.set(key, current);
    }
  }

  const sortedChannels = Array.from(channelTotals.entries()).sort((a, b) => b[1] - a[1]);
  const sortedTasks = Array.from(taskTotals.entries()).sort((a, b) => b[1] - a[1]);
  const trend = Array.from(dateTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ key, label: key, count }));
  const latest = trend.at(-1);
  const previous = trend.at(-2);
  const diff = (latest?.count ?? 0) - (previous?.count ?? 0);
  const callTrend = trend.map(({ key, label }) => {
    const calls = callTotals.get(key) ?? { total: 0, answered: 0 };
    const missed = Math.max(0, calls.total - calls.answered);
    return {
      key,
      label,
      total: calls.total,
      answered: calls.answered,
      missed,
      rate: calls.total ? Math.round((calls.answered / calls.total) * 1000) / 10 : 0,
    };
  });
  const totalCalls = callTrend.reduce((sum, item) => sum + item.total, 0);
  const answeredCalls = callTrend.reduce((sum, item) => sum + item.answered, 0);
  const monthlyUsed = total;
  const remaining = input.tenant.monthlyPlanLimit - monthlyUsed;
  const daysLeft = businessDaysLeft();
  const detailRows = Array.from(new Map(
    input.rows.map((row) => [`${row.channel}:${row.task}`, { channel: row.channel, task: row.task }]),
  ).values()).map((item) => {
    const count = input.rows
      .filter((row) => row.channel === item.channel && row.task === item.task)
      .reduce((sum, row) => sum + row.count, 0);
    return { ...item, count, pct: monthlyUsed ? (count / monthlyUsed) * 100 : 0 };
  }).sort((a, b) => b.count - a.count);

  return {
    tenant: input.tenant,
    range: {
      start: input.start,
      end: input.end,
      grain: input.grain,
      lastDataDate: input.rows.at(-1)?.date ?? null,
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
      missedCalls: Math.max(0, totalCalls - answeredCalls),
      answerRate: totalCalls ? (answeredCalls / totalCalls) * 100 : 0,
    },
    charts: {
      trend,
      byChannel: sortedChannels.map(([channel, count]) => ({ channel, count })),
      byTask: sortedTasks.slice(0, 10).map(([task, count]) => ({ task, count })),
      callTrend,
    },
    table: input.rows.sort((a, b) => b.date.localeCompare(a.date)),
  } satisfies DashboardResponse;
}
