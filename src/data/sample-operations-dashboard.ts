export const operationsSummary = {
  period: "이번 달",
  totalTickets: 1248,
  completedTickets: 1176,
  pendingTickets: 72,
  averageResponseTime: "4분 32초",
  responseRate: 94.2,
};

export const channelVolumes = [
  { name: "채널톡", value: 548, percentage: 44 },
  { name: "카카오 상담톡", value: 324, percentage: 26 },
  { name: "네이버 톡톡", value: 212, percentage: 17 },
  { name: "이메일", value: 102, percentage: 8 },
  { name: "전화", value: 62, percentage: 5 },
];

export const inquiryTypes = [
  { name: "배송 일정 및 조회", value: 326, change: "전월 대비 8% 증가" },
  { name: "교환·반품 요청", value: 244, change: "전월 대비 3% 감소" },
  { name: "상품 정보 문의", value: 198, change: "전월과 유사" },
  { name: "결제·주문 변경", value: 164, change: "전월 대비 5% 증가" },
  { name: "쿠폰·프로모션", value: 112, change: "전월 대비 12% 감소" },
];

export const statusBreakdown = [
  { name: "처리 완료", value: 1176, tone: "bg-[#5B47E0]" },
  { name: "답변 대기", value: 42, tone: "bg-amber-500" },
  { name: "고객사 확인 필요", value: 21, tone: "bg-sky-500" },
  { name: "긴급 확인", value: 9, tone: "bg-rose-500" },
];

export const vocHighlights = [
  "주말 주문의 월요일 출고 일정 문의가 반복적으로 접수되고 있습니다.",
  "프로모션 상품의 교환 가능 여부가 상세 페이지에서 충분히 안내되지 않고 있습니다.",
  "품절 취소 시 쿠폰 복구 시점에 대한 고객 문의가 증가했습니다.",
];

export const improvementSuggestions = [
  {
    title: "배송 안내 문구 보강",
    description:
      "결제 완료 화면과 알림톡에 주말 주문 출고 기준을 노출하면 반복 문의를 줄일 수 있습니다.",
  },
  {
    title: "교환 정책 FAQ 연결",
    description:
      "프로모션 상품 상세 페이지에 교환 가능 조건과 FAQ 링크를 함께 제공해 주세요.",
  },
  {
    title: "쿠폰 복구 자동 안내",
    description:
      "품절 취소 알림에 쿠폰 복구 예상 시간을 포함하면 후속 문의 감소가 예상됩니다.",
  },
];

export const urgentIssues = [
  {
    title: "배송 지연 집중 발생",
    description: "수도권 일부 주문 18건이 약속 출고일을 초과했습니다.",
    status: "확인 필요",
  },
  {
    title: "결제 오류 문의 증가",
    description: "모바일 결제 실패 문의가 최근 2시간 동안 7건 접수됐습니다.",
    status: "모니터링",
  },
];
