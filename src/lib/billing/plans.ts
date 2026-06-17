export const selectablePlans = [
  {
    id: "Starter",
    label: "Starter",
    monthlyFee: 99000,
    includedTickets: 50,
    description: "월 상담 50건",
  },
  {
    id: "Lite",
    label: "Lite",
    monthlyFee: 490000,
    includedTickets: 200,
    description: "월 상담 200건",
  },
  {
    id: "Basic",
    label: "Basic",
    monthlyFee: 990000,
    includedTickets: 500,
    description: "월 상담 500건",
  },
  {
    id: "Pro",
    label: "Pro",
    monthlyFee: 1790000,
    includedTickets: 1000,
    description: "월 상담 1,000건",
  },
] as const;

export type SelectablePlanId = (typeof selectablePlans)[number]["id"];

export function findSelectablePlan(value: unknown) {
  return selectablePlans.find((plan) => plan.id === value);
}
