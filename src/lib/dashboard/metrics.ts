import {
  calculateBillableCount,
  type BillingTaskRule,
} from "./billing.ts";

export type OperationEventMetricRow = {
  provider: string;
  channel: string;
  task_type: string;
  direction: string;
  status: string | null;
  count: number | string;
};

export function buildDailyMetricRows(input: {
  tenantId: string;
  dateKey: string;
  events: OperationEventMetricRow[];
  billingRules: Map<string, BillingTaskRule>;
  updatedAt: string;
}) {
  const groups = new Map<string, {
    provider: string;
    channel: string;
    taskType: string;
    total: number;
    inbound: number;
    outbound: number;
    answered: number;
    missed: number;
    billable: number;
  }>();

  for (const event of input.events) {
    const key = `${event.provider}:${event.channel}:${event.task_type}`;
    const current = groups.get(key) ?? {
      provider: event.provider,
      channel: event.channel,
      taskType: event.task_type,
      total: 0,
      inbound: 0,
      outbound: 0,
      answered: 0,
      missed: 0,
      billable: 0,
    };
    const count = Number(event.count);
    const isMissedCall =
      event.task_type === "전화 - 인바운드" && event.status === "missed";
    if (!isMissedCall) {
      current.total += count;
      if (event.direction === "inbound") current.inbound += count;
      if (event.direction === "outbound") current.outbound += count;
      current.billable += calculateBillableCount(
        count,
        event.provider,
        event.channel,
        event.task_type,
        input.billingRules,
      );
    }
    if (event.task_type === "전화 - 인바운드") {
      if (event.status === "closed") current.answered += count;
      else current.missed += count;
    }
    groups.set(key, current);
  }

  return Array.from(groups.values()).map((group) => ({
    tenant_id: input.tenantId,
    date_key: input.dateKey,
    provider: group.provider,
    channel: group.channel,
    task_type: group.taskType,
    total_count: group.total,
    inbound_count: group.inbound,
    outbound_count: group.outbound,
    answered_count: group.answered,
    missed_count: group.missed,
    billable_count: group.billable,
    updated_at: input.updatedAt,
  }));
}
