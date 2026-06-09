import type { Connector, NormalizedOperationEvent, SyncRange } from "@/lib/connectors/types";

export class KakaoChannelConnector implements Connector {
  readonly provider = "kakao_channel" as const;
  constructor(readonly credentials: { adminKey: string }) {}
  async testConnection() {
    return { ok: false, message: "TODO: 공개 API로 가능한 상담 데이터 범위를 먼저 검증해야 합니다." };
  }
  async fetchEvents(_range: SyncRange): Promise<NormalizedOperationEvent[]> {
    // TODO: 카카오톡 채널 API는 관계/고객 관리 중심이다. 상담톡은 계약 API 확인 후 구현한다.
    return [];
  }
}
