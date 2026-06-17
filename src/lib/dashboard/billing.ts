export type BillingTaskRule = {
  provider: string;
  channel: string;
  taskType: string;
  isBillable: boolean;
  weight: number;
};

export function billingRuleKey(provider: string, channel: string, taskType: string) {
  return `${provider}:${channel}:${taskType}`;
}

export function buildBillingRuleMap(rules: BillingTaskRule[]) {
  return new Map(rules.map((rule) => [
    billingRuleKey(rule.provider, rule.channel, rule.taskType),
    rule,
  ]));
}

export function calculateBillableCount(
  count: number,
  provider: string,
  channel: string,
  taskType: string,
  rules: Map<string, BillingTaskRule>,
) {
  const rule = rules.get(billingRuleKey(provider, channel, taskType));
  if (rules.size === 0 && provider === "channel_talk") return count;
  if (!rule?.isBillable) return 0;
  return count * rule.weight;
}
