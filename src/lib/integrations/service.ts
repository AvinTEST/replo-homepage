import "server-only";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/security/integrationCredentials";
import type { IntegrationSummary } from "@/types/dashboard";

type IntegrationRow = {
  id: string;
  provider: IntegrationSummary["provider"];
  display_name: string;
  status: IntegrationSummary["status"];
  encrypted_credentials: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
};

export function requireAdminClient() {
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return admin;
}

export async function listIntegrations(tenantId: string): Promise<IntegrationSummary[]> {
  if (tenantId === "demo") {
    return [
      {
        id: "demo-channel-talk",
        provider: "channel_talk",
        displayName: "채널톡",
        status: "connected",
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "더미 데이터 연결",
        lastError: null,
        configured: true,
      },
    ];
  }

  const admin = requireAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select(
      "id, provider, display_name, status, encrypted_credentials, last_sync_at, last_sync_status, last_error",
    )
    .eq("tenant_id", tenantId)
    .order("display_name");
  if (error) throw error;

  return ((data ?? []) as IntegrationRow[]).map((item) => ({
    id: item.id,
    provider: item.provider,
    displayName: item.display_name,
    status: item.status,
    lastSyncAt: item.last_sync_at,
    lastSyncStatus: item.last_sync_status,
    lastError: item.last_error,
    configured: Boolean(item.encrypted_credentials),
  }));
}

export async function getChannelTalkIntegration(tenantId: string) {
  const admin = requireAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "channel_talk")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function channelTalkConnectorFromEncrypted(encryptedCredentials: string) {
  const credentials = decryptCredentials(encryptedCredentials);
  if (!credentials.accessKey || !credentials.accessSecret) {
    throw new Error("채널톡 credential이 완전하지 않습니다.");
  }
  return new ChannelTalkConnector({
    accessKey: credentials.accessKey,
    accessSecret: credentials.accessSecret,
  });
}
