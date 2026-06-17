import type { SupabaseMetricRow } from "@/lib/dashboard/aggregate";

/**
 * 런칭 프리뷰(라이브) 환경에서 실데이터가 아직 없는 워크스페이스에 보여줄
 * 더미 운영 데이터입니다. dev 대시보드와 거의 동일한 화면을 구성하기 위해
 * 채널/세부업무/전화 응대까지 포함한 일자별 지표를 생성합니다.
 *
 * 실데이터가 들어오면(loadDashboard에서 metric row가 1건이라도 존재하면)
 * 자동으로 사용되지 않습니다. 정식 오픈 후 이 파일을 제거하면 됩니다.
 */

export const DEMO_PLAN_LIMIT = 3000;
export const DEMO_PLAN_NAME = "스탠다드";

type DemoTarget = {
  provider: string;
  channel: string;
  task_type: string;
  /** 평일 기준 하루 평균 처리 건수 */
  base: number;
  /** 전화 - 인바운드 응대율(0~1). 통화 채널에만 사용 */
  answerRate?: number;
};

const DEMO_TARGETS: DemoTarget[] = [
  { provider: "channel_talk", channel: "채널톡", task_type: "채팅 상담", base: 42 },
  { provider: "channel_talk", channel: "채널톡", task_type: "전화 - 인바운드", base: 18, answerRate: 0.91 },
  { provider: "kakao_channel", channel: "카카오 상담톡", task_type: "고객 상담", base: 27 },
  { provider: "naver_commerce", channel: "네이버 톡톡", task_type: "상품 정보 문의", base: 17 },
  { provider: "naver_commerce", channel: "네이버 톡톡", task_type: "배송 일정 및 조회", base: 13 },
  { provider: "coupang", channel: "쿠팡", task_type: "고객 문의", base: 15 },
  { provider: "coupang", channel: "쿠팡", task_type: "교환·반품 요청", base: 9 },
  { provider: "custom_sheet", channel: "이메일", task_type: "결제·주문 변경", base: 8 },
];

function seededUnit(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function eachDate(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function dailyCount(target: DemoTarget, dateKey: string, dayIndex: number, totalDays: number) {
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  const weekendFactor = weekday === 0 ? 0.45 : weekday === 6 ? 0.6 : 1;
  // 월 초 대비 완만한 상승 추세 (0.88 ~ 1.12)
  const trendFactor = totalDays > 1 ? 0.88 + (dayIndex / (totalDays - 1)) * 0.24 : 1;
  const noise = 0.85 + seededUnit(`${dateKey}:${target.channel}:${target.task_type}`) * 0.3;
  return Math.max(1, Math.round(target.base * weekendFactor * trendFactor * noise));
}

/**
 * 주어진 기간(start~end, 양끝 포함)에 대한 더미 daily_operation_metrics 행을 생성합니다.
 */
export function buildDemoMetricRows(start: string, end: string): SupabaseMetricRow[] {
  const dates = eachDate(start, end);
  const rows: SupabaseMetricRow[] = [];

  dates.forEach((dateKey, dayIndex) => {
    for (const target of DEMO_TARGETS) {
      const total = dailyCount(target, dateKey, dayIndex, dates.length);

      if (target.task_type === "전화 - 인바운드") {
        const rate = target.answerRate ?? 0.9;
        const answered = Math.round(total * rate);
        const missed = Math.max(0, total - answered);
        rows.push({
          date_key: dateKey,
          provider: target.provider,
          channel: target.channel,
          task_type: target.task_type,
          total_count: total,
          answered_count: answered,
          missed_count: missed,
          // 미응대 콜은 과금 대상에서 제외
          billable_count: answered,
        });
        continue;
      }

      rows.push({
        date_key: dateKey,
        provider: target.provider,
        channel: target.channel,
        task_type: target.task_type,
        total_count: total,
        answered_count: 0,
        missed_count: 0,
        billable_count: total,
      });
    }
  });

  return rows;
}
