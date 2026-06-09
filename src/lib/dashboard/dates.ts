import type { Grain } from "@/types/dashboard";

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function defaultRange(grain: Grain) {
  const end = new Date();
  const start = new Date(end);
  if (grain === "day") start.setDate(start.getDate() - 29);
  if (grain === "week") start.setDate(start.getDate() - 83);
  if (grain === "month") start.setMonth(start.getMonth() - 11, 1);
  return { start: isoDate(start), end: isoDate(end) };
}

export function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function businessDaysLeft(now = new Date()) {
  const cursor = new Date(now);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let count = 0;
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function grainKey(dateValue: string, grain: Grain) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  if (grain === "month") return dateValue.slice(0, 7);
  if (grain === "week") {
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return isoDate(date);
  }
  return dateValue;
}
