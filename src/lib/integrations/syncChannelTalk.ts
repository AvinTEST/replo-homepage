import "server-only";
import { isoDate } from "@/lib/dashboard/dates";
import {
  channelTalkConnectorFromEncrypted,
  getChannelTalkIntegration,
  requireAdminClient,
} from "@/lib/integrations/service";

export async function syncChannelTalk(tenantId: string, range?: { from: string; to: string }) {
  const admin = requireAdminClient();
  const integration = await getChannelTalkIntegration(tenantId);
  if (!integration?.encrypted_credentials) {
    throw new Error("채널톡 credential을 먼저 등록해 주세요.");
  }

  const now = new Date();
  const from = range?.from ?? new Date(now.getTime() - 30 * 86400000).toISOString();
  const to = range?.to ?? now.toISOString();
  const { data: job, error: jobError } = await admin
    .from("sync_jobs")
    .insert({
      tenant_id: tenantId,
      integration_id: integration.id,
      provider: "channel_talk",
      status: "running",
      sync_from: from,
      sync_to: to,
      started_at: now.toISOString(),
    })
    .select("id")
    .single();
  if (jobError) throw jobError;

  try {
    const connector = channelTalkConnectorFromEncrypted(integration.encrypted_credentials);
    const events = await connector.fetchEvents({ from, to });
    const payload = events.map((event) => ({
      tenant_id: tenantId,
      integration_id: integration.id,
      provider: event.provider,
      external_id: event.externalId,
      occurred_at: event.occurredAt,
      date_key: isoDate(new Date(event.occurredAt)),
      channel: event.channel,
      task_type: event.taskType,
      direction: event.direction,
      status: event.status,
      count: event.count,
      customer_external_id: event.customerExternalId,
      assignee_name: event.assigneeName,
      response_time_seconds: event.responseTimeSeconds,
      handling_time_seconds: event.handlingTimeSeconds,
      metadata: event.metadata ?? {},
      raw_payload: event.rawPayload ?? {},
    }));

    if (payload.length) {
      const { error } = await admin
        .from("operation_events")
        .upsert(payload, { onConflict: "tenant_id,provider,external_id" });
      if (error) throw error;
    }

    const dateKeys = Array.from(new Set(payload.map((item) => item.date_key)));
    for (const dateKey of dateKeys) {
      const { data: dayEvents, error } = await admin
        .from("operation_events")
        .select("provider, channel, task_type, direction, status, count")
        .eq("tenant_id", tenantId)
        .eq("date_key", dateKey);
      if (error) throw error;

      const groups = new Map<string, {
        provider: string;
        channel: string;
        taskType: string;
        total: number;
        inbound: number;
        outbound: number;
        answered: number;
        missed: number;
      }>();
      for (const event of dayEvents ?? []) {
        const key = `${event.provider}:${event.channel}:${event.task_type}`;
        const current = groups.get(key) ?? {
          provider: event.provider as string,
          channel: event.channel as string,
          taskType: event.task_type as string,
          total: 0,
          inbound: 0,
          outbound: 0,
          answered: 0,
          missed: 0,
        };
        const count = Number(event.count);
        current.total += count;
        if (event.direction === "inbound") current.inbound += count;
        if (event.direction === "outbound") current.outbound += count;
        if (event.task_type === "전화 - 인바운드") {
          if (event.status === "closed") current.answered += count;
          else current.missed += count;
        }
        groups.set(key, current);
      }
      const metrics = Array.from(groups.values()).map((group) => ({
        tenant_id: tenantId,
        date_key: dateKey,
        provider: group.provider,
        channel: group.channel,
        task_type: group.taskType,
        total_count: group.total,
        inbound_count: group.inbound,
        outbound_count: group.outbound,
        answered_count: group.answered,
        missed_count: group.missed,
        billable_count: group.total,
        updated_at: new Date().toISOString(),
      }));
      if (metrics.length) {
        const { error: metricError } = await admin
          .from("daily_operation_metrics")
          .upsert(metrics, { onConflict: "tenant_id,date_key,provider,channel,task_type" });
        if (metricError) throw metricError;
      }
    }

    await Promise.all([
      admin
        .from("sync_jobs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          records_fetched: events.length,
          records_inserted: events.length,
        })
        .eq("id", job.id),
      admin
        .from("channel_integrations")
        .update({
          status: "connected",
          last_sync_at: new Date().toISOString(),
          last_sync_status: `${events.length}건 동기화`,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id),
    ]);

    return { ok: true, records: events.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 동기화 오류";
    await Promise.all([
      admin
        .from("sync_jobs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", job.id),
      admin
        .from("channel_integrations")
        .update({
          status: "error",
          last_sync_status: "failed",
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration.id),
    ]);
    throw error;
  }
}
