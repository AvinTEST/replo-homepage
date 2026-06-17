import type { Grain } from "@/types/dashboard";

type ChartItem = {
  key: string;
  value: number;
};

type CallChartItem = {
  key: string;
  total: number;
  answered: number;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayCount(start: string, end: string) {
  return Math.floor(
    (new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) /
      86400000,
  ) + 1;
}

export function responsiveChartGrain(start: string, end: string, maxPoints: number): Grain {
  const days = dayCount(start, end);
  const capacity = Math.max(2, maxPoints);
  if (days <= capacity) return "day";
  if (Math.ceil(days / 7) <= capacity) return "week";
  return "month";
}

function bucketKey(dateValue: string, grain: Grain) {
  if (grain === "month") return dateValue.slice(0, 7);
  if (grain === "week") {
    const date = new Date(`${dateValue}T00:00:00Z`);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return isoDate(date);
  }
  return dateValue;
}

function labelForBucket(key: string, grain: Grain, start: string, end: string) {
  if (grain === "day") return key.slice(5).replace("-", ".");
  if (grain === "month") return key.replace("-", ".");
  const weekEnd = new Date(`${key}T00:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const visibleStart = key < start ? start : key;
  const visibleEnd = isoDate(weekEnd) > end ? end : isoDate(weekEnd);
  return `${visibleStart.slice(5).replace("-", ".")}~${visibleEnd.slice(5).replace("-", ".")}`;
}

export function buildResponsiveChartSeries(
  items: ChartItem[],
  start: string,
  end: string,
  maxPoints: number,
) {
  const grain = responsiveChartGrain(start, end, maxPoints);
  const valuesByDate = new Map(items.map((item) => [item.key, item.value]));
  const buckets = new Map<string, number>();
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (cursor <= last) {
    const date = isoDate(cursor);
    const key = bucketKey(date, grain);
    buckets.set(key, (buckets.get(key) ?? 0) + (valuesByDate.get(date) ?? 0));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    grain,
    points: Array.from(buckets, ([key, value]) => ({
      key,
      label: labelForBucket(key, grain, start, end),
      value,
    })),
  };
}

export function buildResponsiveCallChartSeries(
  items: CallChartItem[],
  start: string,
  end: string,
  maxPoints: number,
) {
  const grain = responsiveChartGrain(start, end, maxPoints);
  const valuesByDate = new Map(items.map((item) => [item.key, item]));
  const buckets = new Map<string, { total: number; answered: number }>();
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (cursor <= last) {
    const date = isoDate(cursor);
    const key = bucketKey(date, grain);
    const value = valuesByDate.get(date);
    const bucket = buckets.get(key) ?? { total: 0, answered: 0 };
    bucket.total += value?.total ?? 0;
    bucket.answered += value?.answered ?? 0;
    buckets.set(key, bucket);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    grain,
    points: Array.from(buckets, ([key, value]) => ({
      key,
      label: labelForBucket(key, grain, start, end),
      total: value.total,
      answered: value.answered,
      rate: value.total ? (value.answered / value.total) * 100 : 0,
    })),
  };
}
