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

export async function getChannelTalkIntegration(tenantId: string, integrationId?: string) {
  const admin = requireAdminClient();
  let query = admin
    .from("channel_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "channel_talk");
  if (integrationId) query = query.eq("id", integrationId);
  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function channelTalkConnectorFromIntegration(integration: {
  encrypted_credentials?: string | null;
  access_key_encrypted?: string | null;
  access_secret_encrypted?: string | null;
}) {
  const credentials = integration.encrypted_credentials
    ? decryptCredentials(integration.encrypted_credentials)
    : {
        accessKey: integration.access_key_encrypted
          ? decryptCredentialValue(integration.access_key_encrypted)
          : "",
        accessSecret: integration.access_secret_encrypted
          ? decryptCredentialValue(integration.access_secret_encrypted)
          : "",
      };
  if (!credentials.accessKey || !credentials.accessSecret) {
    throw new Error("채널톡 credential이 완전하지 않습니다.");
  }
  return new ChannelTalkConnector({
    accessKey: credentials.accessKey,
    accessSecret: credentials.accessSecret,
  });
}
