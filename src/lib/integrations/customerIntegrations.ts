import "server-only";
import { ChannelTalkConnector } from "@/lib/connectors/channelTalkConnector";
import {
  decryptCredentialValue,
  encryptCredentialValue,
} from "@/lib/security/integrationCredentials";
import { createAdminClient } from "@/lib/supabase/admin";

export function maskAccessKey(value: string) {
  if (value.length <= 8) return `${value.slice(0, 2)}••••${value.slice(-2)}`;
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}

export async function getCustomerIntegration(customerId: string, id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("channel_integrations")
    .select(
      "id, tenant_id, customer_id, brand_id, provider, channel_name, display_name, access_key_masked, access_key_encrypted, access_secret_encrypted, status, last_checked_at, last_synced_at, created_at",
    )
    .eq("id", id)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function connectorFromStoredIntegration(integration: {
  access_key_encrypted: string | null;
  access_secret_encrypted: string | null;
}) {
  if (!integration.access_key_encrypted || !integration.access_secret_encrypted) {
    throw new Error("저장된 채널톡 인증 정보가 없습니다.");
  }
  return new ChannelTalkConnector({
    accessKey: decryptCredentialValue(integration.access_key_encrypted),
    accessSecret: decryptCredentialValue(integration.access_secret_encrypted),
  });
}

export function encryptedChannelTalkCredentials(accessKey: string, accessSecret: string) {
  return {
    access_key_masked: maskAccessKey(accessKey),
    access_key_encrypted: encryptCredentialValue(accessKey),
    access_secret_encrypted: encryptCredentialValue(accessSecret),
  };
}
