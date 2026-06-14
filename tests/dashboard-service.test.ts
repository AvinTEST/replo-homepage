import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBillingRuleMap,
  calculateBillableCount,
} from "../src/lib/dashboard/billing.ts";
import { createCsv } from "../src/lib/dashboard/csv.ts";
import {
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
