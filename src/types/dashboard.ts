export type Provider =
  | "channel_talk"
  | "naver_commerce"
  | "coupang"
  | "kakao_channel"
  | "cafe24"
  | "custom_sheet";

export type Grain = "day" | "week" | "month";

export type DashboardResponse = {
  tenant: {
    id: string;
    name: string;
    planName: string;
    monthlyPlanLimit: number;
  };
  range: {
    start: string;
    end: string;
    grain: Grain;
    lastDataDate: string | null;
  };
  sync: {
    status: "ok" | "error" | "loading" | "never_synced";
    lastSyncAt: string | null;
    message: string;
  };
  filters: {
    channels: string[];
    tasks: string[];
  };
  planUsage: {
    planLimit: number;
    monthlyUsed: number;
    remaining: number;
    usageRate: number;
    remainingRate: number;
    businessDaysLeft: number;
    dailyNeed: number;
    detailRows: Array<{
      channel: string;
      task: string;
      count: number;
      pct: number;
    }>;
  };
  operationKpis: {
    total: number;
    activeChannels: number;
    topChannel: { name: string; count: number } | null;
    topTask: { name: string; count: number } | null;
    dayOverDay: {
      diff: number;
      diffPct: number | null;
      prevDate: string | null;
      lastDate: string | null;
    };
  };
  callKpis: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    answerRate: number;
  };
  charts: {
    trend: Array<{ key: string; label: string; count: number }>;
    byChannel: Array<{ channel: string; count: number }>;
    byTask: Array<{ task: string; count: number }>;
    callTrend: Array<{
      key: string;
      label: string;
      total: number;
      answered: number;
      missed: number;
      rate: number;
    }>;
  };
  table: Array<{
    date: string;
    channel: string;
    task: string;
    count: number;
    memo?: string;
  }>;
};

export type IntegrationSummary = {
  id: string;
  provider: Provider;
  displayName: string;
  status: "disconnected" | "connected" | "error" | "paused";
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  configured: boolean;
};
