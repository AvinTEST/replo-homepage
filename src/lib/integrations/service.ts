import "server-only";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  decryptCredentials,
  decryptCredentialValue,
} from "@/lib/security/integrationCredentials";
import type { IntegrationSummary } from "@/types/dashboard";

type IntegrationRow = {
  id: string;
  provider: IntegrationSummary["provider"];
  display_name: string;
  status: IntegrationSummary["status"];
  encrypted_credentials: string | null;
  access_key_encrypted: string | null;
  access_secret_encrypted: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
};

export function requireAdminClient() {
  return createAdminClient();
}

export async function listIntegrations(tenantId: string): Promise<IntegrationSummary[]> {
  const admin = requireAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select(
      "id, provider, display_name, status, encrypted_credentials, access_key_encrypted, access_secret_encrypted, last_sync_at, last_sync_status, last_error",
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
    configured: Boolean(
      item.encrypted_credentials ||
        (item.access_key_encrypted && item.access_secret_encrypted),
    ),
  }));
}

export async function getChannelTalkIntegrations(tenantId: string) {
  const admin = requireAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "channel_talk")
    .eq("status", "connected")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getChannelTalkIntegration(tenantId: string) {
  const admin = requireAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "channel_talk")
    .order("created_at", { ascending: true })
    .limit(1)
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

export function channelTalkConnectorFromIntegration(integration: {
  encrypted_credentials?: string | null;
  access_key_encrypted?: string | null;
  access_secret_encrypted?: string | null;
}) {
  if (
    integration.access_key_encrypted &&
    integration.access_secret_encrypted
  ) {
    return new ChannelTalkConnector({
      accessKey: decryptCredentialValue(integration.access_key_encrypted),
      accessSecret: decryptCredentialValue(integration.access_secret_encrypted),
    });
  }
  if (integration.encrypted_credentials) {
    return channelTalkConnectorFromEncrypted(integration.encrypted_credentials);
  }
  throw new Error("저장된 채널톡 인증 정보가 없습니다.");
}
