import type { Connector, NormalizedOperationEvent, SyncRange } from "@/lib/connectors/types";

export class Cafe24Connector implements Connector {
  readonly provider = "cafe24" as const;
  constructor(readonly credentials: { mallId: string; refreshToken: string }) {}
  async testConnection() {
    return { ok: false, message: "TODO: 카페24 Admin API OAuth 연동이 필요합니다." };
  }
  async fetchEvents(_range: SyncRange): Promise<NormalizedOperationEvent[]> {
    // TODO: 주문/취소/교환/반품 데이터의 운영 이벤트 정규화 범위를 확정한다.
    return [];
  }
}
