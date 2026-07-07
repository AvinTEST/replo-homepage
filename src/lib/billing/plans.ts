export const selectablePlans = [
  {
    id: "Basic",
    label: "Basic",
    monthlyFee: 590000,
    includedTickets: 200,
    description: "월 상담 200건",
  },
  {
    id: "Pro",
    label: "Pro",
    monthlyFee: 1790000,
    includedTickets: 1000,
    description: "월 상담 1,000건",
  },
  {
    id: "Enterprise",
    label: "Enterprise",
    monthlyFee: 0,
    includedTickets: 2000,
    description: "월 상담 2,000건+ · 별도 협의",
  },
] as const;

export type SelectablePlanId = (typeof selectablePlans)[number]["id"];

export function findSelectablePlan(value: unknown) {
  return selectablePlans.find((plan) => plan.id === value);
}
