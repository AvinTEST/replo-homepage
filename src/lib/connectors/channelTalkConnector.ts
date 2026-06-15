import "server-only";
import { channelTalkProcessedAt } from "@/lib/connectors/channelTalkDates";
import { ConnectorError } from "@/lib/connectors/errors";
import type {
  Connector,
  NormalizedOperationEvent,
  SyncRange,
} from "@/lib/connectors/types";

type ChannelTalkCredentials = {
  accessKey: string;
  accessSecret: string;
};

type UserChat = Record<string, unknown> & {
  id?: string;
  state?: string;
  createdAt?: number | string;
  openedAt?: number | string;
  closedAt?: number | string;
  contactMediumType?: string;
  userId?: string;
  assigneeId?: string;
};

const API_BASE = "https://api.channel.io";
const MAX_PAGES_PER_STATE = 1000;

function redactPayload(chat: UserChat) {
  return {
    id: chat.id,
    state: chat.state,
    createdAt: chat.createdAt,
    openedAt: chat.openedAt,
    closedAt: chat.closedAt,
    contactMediumType: chat.contactMediumType,
  };
}

export class ChannelTalkConnector implements Connector {
  readonly provider = "channel_talk" as const;

  constructor(private readonly credentials: ChannelTalkCredentials) {}

  private async request<T>(path: string, attempt = 0): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "x-access-key": this.credentials.accessKey,
        "x-access-secret": this.credentials.accessSecret,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 429 && attempt < 4) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.request<T>(path, attempt + 1);
    }
    if (response.status === 401) {
      throw new ConnectorError("Access Key 또는 Access Secret을 확인해 주세요.", "unauthorized", 401);
    }
    if (response.status === 403) {
      throw new ConnectorError("채널톡 Open API 접근 권한이 없습니다.", "forbidden", 403);
    }
    if (response.status === 429) {
      throw new ConnectorError("채널톡 API 요청 한도를 초과했습니다.", "rate_limited", 429);
    }
    if (!response.ok) {
      throw new ConnectorError(`채널톡 API 오류 (${response.status})`, "upstream", response.status);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ConnectorError("채널톡 응답을 해석할 수 없습니다.", "invalid_response");
    }
  }

  async testConnection() {
    await this.request<Record<string, unknown>>("/open/v5/channel");
    return { ok: true, message: "채널톡 연결이 확인되었습니다." };
  }

  async fetchEvents(range: SyncRange) {
    const events = new Map<string, NormalizedOperationEvent>();

    for (const state of ["closed"]) {
      let since: string | undefined;
      const seenCursors = new Set<string>();

      for (let page = 0; page < MAX_PAGES_PER_STATE; page += 1) {
        const params = new URLSearchParams({
          state,
          limit: "500",
          sortOrder: "desc",
        });
        if (since) params.set("since", since);

        const body = await this.request<{
          userChats?: UserChat[];
          chats?: UserChat[];
          next?: string | null;
        }>(`/open/v5/user-chats?${params.toString()}`);
        const chats = body.userChats ?? body.chats ?? [];

        for (const chat of chats) {
          const occurredAt = channelTalkProcessedAt({
            state: chat.state ?? state,
            closedAt: chat.closedAt,
          });
          if (!occurredAt || !chat.id) continue;
          if (occurredAt < range.from || occurredAt > range.to) continue;
          const medium = String(chat.contactMediumType ?? "").toLowerCase();
          const isCall = medium.includes("phone") || medium.includes("call");

          events.set(chat.id, {
            provider: this.provider,
            externalId: chat.id,
            occurredAt,
            channel: "채널톡",
            taskType: isCall ? "전화 - 인바운드" : "채팅",
            direction: "inbound",
            status: chat.state,
            count: 1,
            customerExternalId: chat.userId,
            assigneeName: chat.assigneeId,
            metadata: { contactMediumType: chat.contactMediumType },
            rawPayload: redactPayload(chat),
          });
        }

        const next = body.next ?? null;
        if (
          chats.length === 0 ||
          !next ||
          seenCursors.has(next)
        ) {
          break;
        }
        if (page === MAX_PAGES_PER_STATE - 1) {
          throw new ConnectorError(
            "채널톡 동기화 페이지 한도에 도달했습니다. 조회 기간을 줄여 다시 시도해 주세요.",
            "upstream",
          );
        }
        seenCursors.add(next);
        since = next;
      }
    }

    return Array.from(events.values()).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }
}
