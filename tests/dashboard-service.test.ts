import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBillingRuleMap,
  calculateBillableCount,
} from "../src/lib/dashboard/billing.ts";
import {
  channelTalkCallAt,
  channelTalkMissedCallAt,
  channelTalkProcessedAt,
} from "../src/lib/connectors/channelTalkDates.ts";
import {
  channelTalkCallDirection,
  channelTalkCallStatus,
} from "../src/lib/connectors/channelTalkCalls.ts";
import { buildResponsiveChartSeries } from "../src/lib/dashboard/chartSeries.ts";
import { createCsv } from "../src/lib/dashboard/csv.ts";
import {
  automaticGrain,
  calendarMonthRange,
  dateKeyInTimeZone,
} from "../src/lib/dashboard/dates.ts";
import { buildDailyMetricRows } from "../src/lib/dashboard/metrics.ts";
import { isValidBearerSecret } from "../src/lib/security/cron.ts";
import { validSyncTargets } from "../src/lib/integrations/syncTargets.ts";
import {
  buildDashboardFromMetricFixtures,
  type SupabaseMetricRow,
} from "../src/lib/dashboard/aggregate.ts";

const selectedMetrics: SupabaseMetricRow[] = [
  {
    date_key: "2026-06-08",
    provider: "channel_talk",
    channel: "채널톡",
    task_type: "전화 - 인바운드",
    total_count: 12,
    answered_count: 7,
    missed_count: 5,
    billable_count: 12,
  },
  {
    date_key: "2026-06-09",
    provider: "channel_talk",
    channel: "채널톡",
    task_type: "채팅",
    total_count: 20,
    answered_count: 0,
    missed_count: 0,
    billable_count: 20,
  },
];

const monthlyMetrics: SupabaseMetricRow[] = [
  {
    date_key: "2026-06-01",
    provider: "channel_talk",
    channel: "채널톡",
    task_type: "채팅",
    total_count: 100,
    answered_count: 0,
    missed_count: 0,
    billable_count: 50,
  },
  {
    date_key: "2026-06-09",
    provider: "coupang",
    channel: "쿠팡",
    task_type: "고객 문의",
    total_count: 40,
    answered_count: 0,
    missed_count: 0,
    billable_count: 80,
  },
];

test("real metric fixtures preserve DB call counts and calendar-month billable usage", () => {
  const dashboard = buildDashboardFromMetricFixtures({
    tenant: {
      id: "tenant-fixture",
      name: "Fixture",
      planName: "Basic",
      monthlyPlanLimit: 1000,
    },
    grain: "day",
    start: "2026-06-08",
    end: "2026-06-09",
    referenceDate: "2026-06-09",
    selectedMetrics,
    monthlyMetrics,
    sync: { status: "ok", lastSyncAt: null, message: "fixture" },
  });

  assert.deepEqual(dashboard.callKpis, {
    totalCalls: 12,
    answeredCalls: 7,
    missedCalls: 5,
    answerRate: 7 / 12 * 100,
  });
  assert.equal(dashboard.planUsage.monthlyUsed, 130);
  assert.equal(dashboard.operationKpis.total, 32);
  assert.deepEqual(
    dashboard.planUsage.detailRows.map(({ channel, count }) => [channel, count]),
    [["쿠팡", 80], ["채널톡", 50]],
  );

  const weeklyDashboard = buildDashboardFromMetricFixtures({
    tenant: {
      id: "tenant-fixture",
      name: "Fixture",
      planName: "Basic",
      monthlyPlanLimit: 1000,
    },
    grain: "week",
    start: "2026-06-03",
    end: "2026-06-09",
    referenceDate: "2026-06-09",
    selectedMetrics: [
      { ...selectedMetrics[0], date_key: "2026-06-03" },
      ...selectedMetrics,
    ],
    monthlyMetrics,
    sync: { status: "ok", lastSyncAt: null, message: "fixture" },
  });
  assert.deepEqual(
    weeklyDashboard.charts.trend.map(({ label }) => label),
    ["06.03~06.07", "06.08~06.09"],
  );
});

test("billing rules apply is_billable and weight", () => {
  const rules = buildBillingRuleMap([
    {
      provider: "channel_talk",
      channel: "채널톡",
      taskType: "채팅",
      isBillable: true,
      weight: 0.5,
    },
    {
      provider: "channel_talk",
      channel: "채널톡",
      taskType: "전화 - 인바운드",
      isBillable: false,
      weight: 2,
    },
  ]);

  assert.equal(calculateBillableCount(10, "channel_talk", "채널톡", "채팅", rules), 5);
  assert.equal(
    calculateBillableCount(10, "channel_talk", "채널톡", "전화 - 인바운드", rules),
    0,
  );
  assert.equal(calculateBillableCount(10, "coupang", "쿠팡", "고객 문의", rules), 0);
  assert.equal(calculateBillableCount(10, "channel_talk", "채널톡", "채팅", new Map()), 10);

  const metrics = buildDailyMetricRows({
    tenantId: "tenant-fixture",
    dateKey: "2026-06-09",
    updatedAt: "2026-06-09T00:00:00.000Z",
    billingRules: rules,
    events: [
      {
        provider: "channel_talk",
        channel: "채널톡",
        task_type: "채팅",
        direction: "inbound",
        status: "closed",
        count: 10,
      },
      {
        provider: "channel_talk",
        channel: "채널톡",
        task_type: "전화 - 인바운드",
        direction: "inbound",
        status: "closed",
        count: 4,
      },
    ],
  });
  assert.equal(metrics.find((row) => row.task_type === "채팅")?.billable_count, 5);
  assert.equal(metrics.find((row) => row.task_type === "전화 - 인바운드")?.billable_count, 0);
  assert.equal(metrics.find((row) => row.task_type === "전화 - 인바운드")?.answered_count, 4);
});

test("tenant timezone determines date_key", () => {
  assert.equal(dateKeyInTimeZone("2026-06-08T16:30:00.000Z", "Asia/Seoul"), "2026-06-09");
  assert.equal(dateKeyInTimeZone("2026-06-08T16:30:00.000Z", "UTC"), "2026-06-08");
  assert.deepEqual(
    calendarMonthRange("Asia/Seoul", new Date("2026-05-31T16:00:00.000Z")),
    { start: "2026-06-01", end: "2026-06-01" },
  );
  assert.deepEqual(
    calendarMonthRange("Asia/Seoul", new Date("2026-05-20T03:00:00.000Z")),
    { start: "2026-05-01", end: "2026-05-20" },
  );
  assert.equal(automaticGrain("2026-06-01", "2026-06-30"), "day");
  assert.equal(automaticGrain("2026-06-01", "2026-07-26"), "week");
  assert.equal(automaticGrain("2026-01-01", "2026-06-30"), "month");
});

test("ChannelTalk processed date uses closedAt and excludes unresolved chats", () => {
  assert.equal(
    channelTalkProcessedAt({ state: "closed", closedAt: 1780877260093 }),
    "2026-06-08T00:07:40.093Z",
  );
  assert.equal(
    channelTalkProcessedAt({ state: "closed", closedAt: "1780877260093" }),
    "2026-06-08T00:07:40.093Z",
  );
  assert.equal(channelTalkProcessedAt({ state: "opened", closedAt: 1780877260093 }), null);
  assert.equal(channelTalkProcessedAt({ state: "closed" }), null);
});

test("ChannelTalk calls use openedAt and only missed state counts as missed", () => {
  assert.equal(
    channelTalkCallAt({ state: "closed", openedAt: 1780877260093 }),
    "2026-06-08T00:07:40.093Z",
  );
  assert.equal(
    channelTalkCallAt({ state: "missed", openedAt: 1780877260093 }),
    "2026-06-08T00:07:40.093Z",
  );
  assert.equal(channelTalkCallAt({ state: "opened", openedAt: 1780877260093 }), null);
  assert.equal(
    channelTalkMissedCallAt({ state: "missed", openedAt: 1780877260093 }),
    "2026-06-08T00:07:40.093Z",
  );
  assert.equal(channelTalkMissedCallAt({ state: "closed", openedAt: 1780877260093 }), null);
  assert.equal(
    channelTalkCallDirection({ state: "closed", firstAskedAt: 1780877260093 }),
    "inbound",
  );
  assert.equal(channelTalkCallDirection({ state: "closed" }), "outbound");
  assert.equal(channelTalkCallDirection({ state: "missed" }), "inbound");
  assert.equal(channelTalkCallStatus({ state: "closed" }), "closed");
  assert.equal(
    channelTalkCallStatus({ state: "closed", missedReason: "ringTimeOver" }),
    "missed",
  );
  assert.equal(channelTalkCallStatus({ state: "missed" }), "missed");

  const metrics = buildDailyMetricRows({
    tenantId: "tenant-fixture",
    dateKey: "2026-06-08",
    updatedAt: "2026-06-08T00:00:00.000Z",
    billingRules: new Map(),
    events: [
      {
        provider: "channel_talk",
        channel: "채널톡",
        task_type: "전화 - 인바운드",
        direction: "inbound",
        status: "closed",
        count: 7,
      },
      {
        provider: "channel_talk",
        channel: "채널톡",
        task_type: "전화 - 인바운드",
        direction: "inbound",
        status: "missed",
        count: 3,
      },
    ],
  });
  assert.equal(metrics[0].total_count, 7);
  assert.equal(metrics[0].answered_count, 7);
  assert.equal(metrics[0].missed_count, 3);
  assert.equal(metrics[0].billable_count, 7);
});

test("chart grain follows available width and preserves empty dates", () => {
  const daily = buildResponsiveChartSeries(
    [
      { key: "2026-06-01", value: 3 },
      { key: "2026-06-03", value: 4 },
    ],
    "2026-06-01",
    "2026-06-03",
    3,
  );
  assert.equal(daily.grain, "day");
  assert.deepEqual(daily.points.map(({ value }) => value), [3, 0, 4]);

  const weekly = buildResponsiveChartSeries(
    [{ key: "2026-06-08", value: 12 }],
    "2026-06-01",
    "2026-06-30",
    8,
  );
  assert.equal(weekly.grain, "week");
  assert.equal(weekly.points.reduce((sum, point) => sum + point.value, 0), 12);
});

test("CSV cells neutralize spreadsheet formulas", () => {
  const csv = createCsv([["=SUM(1,1)", "+cmd", "-10", "@evil", "safe"]]);
  assert.equal(csv, "\"'=SUM(1,1)\",\"'+cmd\",\"'-10\",\"'@evil\",\"safe\"");
});

test("cron bearer secret validation uses a constant-time digest comparison", () => {
  assert.equal(isValidBearerSecret("Bearer correct-secret", "correct-secret"), true);
  assert.equal(isValidBearerSecret("Bearer wrong-secret", "correct-secret"), false);
  assert.equal(isValidBearerSecret(null, "correct-secret"), false);
});

test("cron sync targets reject null tenancy and preserve multiple integrations", () => {
  assert.deepEqual(
    validSyncTargets([
      { id: "integration-a", tenant_id: "tenant-1" },
      { id: "integration-b", tenant_id: "tenant-1" },
      { id: "integration-a", tenant_id: "tenant-1" },
      { id: "integration-c", tenant_id: null },
    ]),
    [
      { integrationId: "integration-a", tenantId: "tenant-1" },
      { integrationId: "integration-b", tenantId: "tenant-1" },
    ],
  );
});
