import type { Connector, NormalizedOperationEvent, SyncRange } from "@/lib/connectors/types";

export class NaverCommerceConnector implements Connector {
  readonly provider = "naver_commerce" as const;
  constructor(
    readonly credentials: { clientId: string; clientSecret: string },
  ) {}
  async testConnection() {
    return { ok: false, message: "TODO: 네이버 커머스API 인증 및 문의 API를 연결해야 합니다." };
  }
  async fetchEvents(_range: SyncRange): Promise<NormalizedOperationEvent[]> {
    // TODO: 네이버 커머스API의 문의/주문/취소·교환·반품 문서를 기준으로 정규화한다.
    return [];
  }
}
