import type { Connector, NormalizedOperationEvent, SyncRange } from "@/lib/connectors/types";

export class CoupangConnector implements Connector {
  readonly provider = "coupang" as const;
  constructor(
    readonly credentials: { vendorId: string; accessKey: string; secretKey: string },
  ) {}
  async testConnection() {
    return { ok: false, message: "TODO: 쿠팡 Open API HMAC 인증을 연결해야 합니다." };
  }
  async fetchEvents(_range: SyncRange): Promise<NormalizedOperationEvent[]> {
    // TODO: Customer Product Inquiry 및 Contact Center Inquiry API를 연결한다.
    return [];
  }
}
