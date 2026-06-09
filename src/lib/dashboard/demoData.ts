import {
  aggregateDashboardMetrics,
  type DashboardMetricRow,
} from "@/lib/dashboard/aggregate";
import { calendarMonthRange, defaultRange, isoDate } from "@/lib/dashboard/dates";
import type { DashboardResponse, Grain } from "@/types/dashboard";

const channels = [
  ["채널톡", "채팅"],
  ["채널톡", "전화 - 인바운드"],
  ["스마트스토어센터", "문의 관리"],
  ["쿠팡", "고객 문의"],
  ["어드민패널", "AS 교환"],
] as const;

function createRows(
  start: string,
  end: string,
  channelFilter?: string,
  taskFilter?: string,
) {
  const rows: DashboardMetricRow[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  let dayIndex = 0;

  while (cursor <= last) {
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) {
      channels.forEach(([channel, task], index) => {
        const count = 8 + ((dayIndex * 7 + index * 11) % 36);
        if ((!channelFilter || channel === channelFilter) && (!taskFilter || task === taskFilter)) {
          const isInboundCall = task === "전화 - 인바운드";
          const answeredCount = isInboundCall ? Math.round(count * 0.87) : 0;
          rows.push({
            date: isoDate(cursor),
            provider:
              channel === "채널톡"
                ? "channel_talk"
                : channel === "쿠팡"
                  ? "coupang"
                  : "custom_sheet",
            channel,
            task,
            count,
            answeredCount,
            missedCount: isInboundCall ? count - answeredCount : 0,
            billableCount: count,
            memo: index === 1 && dayIndex % 6 === 0 ? "캠페인 유입 증가" : "",
          });
        }
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    dayIndex += 1;
  }
  return rows;
}

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
  const month = calendarMonthRange("Asia/Seoul");

  return aggregateDashboardMetrics({
    tenant: {
      id: "demo",
      name: "Replo 데모 고객사",
      planName: "Enterprise Plan",
      monthlyPlanLimit: 5000,
    },
    grain,
    start: rangeStart,
    end: rangeEnd,
    referenceDate: month.end,
    selectedRows: createRows(rangeStart, rangeEnd, channelFilter, taskFilter),
    monthlyRows: createRows(month.start, month.end),
    sync: {
      status: "ok",
      lastSyncAt: new Date().toISOString(),
      message: "더미 데이터로 미리보기 중",
    },
  }) satisfies DashboardResponse;
}
