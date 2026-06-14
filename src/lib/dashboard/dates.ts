import type { Grain } from "@/types/dashboard";

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function dateKeyInTimeZone(date: Date | string, timeZone = "Asia/Seoul") {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function calendarMonthRange(timeZone = "Asia/Seoul", now = new Date()) {
  const end = dateKeyInTimeZone(now, timeZone);
  return { start: `${end.slice(0, 7)}-01`, end };
}

export function automaticGrain(start: string, end: string): Grain {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  if (days <= 31) return "day";
  if (days <= 56) return "week";
  return "month";
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
