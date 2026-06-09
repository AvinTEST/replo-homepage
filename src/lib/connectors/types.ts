import type { Provider } from "@/types/dashboard";

export type SyncRange = {
  from: string;
  to: string;
};

export type NormalizedOperationEvent = {
  provider: Provider;
  externalId: string;
  occurredAt: string;
  channel: string;
  taskType: string;
  direction: "inbound" | "outbound" | "internal";
  status?: string;
  count: number;
  customerExternalId?: string;
  assigneeName?: string;
  responseTimeSeconds?: number;
  handlingTimeSeconds?: number;
  metadata?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
};

export interface Connector {
  provider: Provider;
  testConnection(): Promise<{ ok: boolean; message?: string }>;
  fetchEvents(range: SyncRange): Promise<NormalizedOperationEvent[]>;
}

export type CredentialField = {
  key: string;
  label: string;
  secret?: boolean;
};

export type ConnectorDefinition = {
  provider: Provider;
  displayName: string;
  credentialFields: CredentialField[];
  availability: "available" | "planned";
};
