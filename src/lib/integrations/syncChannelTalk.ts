import "server-only";
import {
  buildBillingRuleMap,
  type BillingTaskRule,
} from "@/lib/dashboard/billing";
import { dateKeyInTimeZone } from "@/lib/dashboard/dates";
import {
  buildDailyMetricRows,
  type OperationEventMetricRow,
} from "@/lib/dashboard/metrics";
import {
  channelTalkConnectorFromIntegration,
  getChannelTalkIntegration,
  requireAdminClient,
} from "@/lib/integrations/service";

export async function syncChannelTalk(
  tenantId: string,
  integrationId: string,
  range?: { from: string; to: string },
) {
  const admin = requireAdminClient();
  const [integration, tenantResult, rulesResult] = await Promise.all([
    getChannelTalkIntegration(tenantId, integrationId),
    admin.from("tenants").select("timezone").eq("id", tenantId).single(),
    admin
      .from("billing_task_rules")
      .select("provider, channel, task_type, is_billable, weight")
      .eq("tenant_id", tenantId),
  ]);
  if (!integration) {
    throw new Error("채널톡 credential을 먼저 등록해 주세요.");
  }
  if (tenantResult.error) throw tenantResult.error;
  if (rulesResult.error) throw rulesResult.error;
  const timezone = (tenantResult.data?.timezone as string | null) || "Asia/Seoul";
  const billingRules = buildBillingRuleMap(
    (rulesResult.data ?? []).map((rule) => ({
      provider: rule.provider as string,
      channel: rule.channel as string,
      taskType: rule.task_type as string,
      isBillable: Boolean(rule.is_billable),
      weight: Number(rule.weight),
    })) satisfies BillingTaskRule[],
  );

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
    const connector = channelTalkConnectorFromIntegration(integration);
    const events = await connector.fetchEvents({ from, to });
    const { data: removedOpenEvents, error: removeOpenError } = await admin
      .from("operation_events")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("integration_id", integration.id)
      .neq("status", "closed")
      .select("date_key");
    if (removeOpenError) throw removeOpenError;

    const { data: previousEvents, error: previousEventsError } = await admin
      .from("operation_events")
      .select("date_key")
      .eq("tenant_id", tenantId)
      .eq("integration_id", integration.id);
    if (previousEventsError) throw previousEventsError;

    const payload = events.map((event) => ({
      tenant_id: tenantId,
      integration_id: integration.id,
      provider: event.provider,
      external_id: event.externalId,
      occurred_at: event.occurredAt,
      date_key: dateKeyInTimeZone(event.occurredAt, timezone),
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
        .upsert(payload, {
          onConflict: "tenant_id,integration_id,provider,external_id",
        });
      if (error) throw error;
    }

    const dateKeys = Array.from(new Set([
      ...(removedOpenEvents ?? []).map((item) => item.date_key as string),
      ...(previousEvents ?? []).map((item) => item.date_key as string),
      ...payload.map((item) => item.date_key),
    ]));
    for (const dateKey of dateKeys) {
      const { data: dayEvents, error } = await admin
        .from("operation_events")
        .select("provider, channel, task_type, direction, status, count")
        .eq("tenant_id", tenantId)
        .eq("date_key", dateKey);
      if (error) throw error;

      const metrics = buildDailyMetricRows({
        tenantId,
        dateKey,
        events: (dayEvents ?? []) as OperationEventMetricRow[],
        billingRules,
        updatedAt: new Date().toISOString(),
      });
      const { error: clearMetricError } = await admin
        .from("daily_operation_metrics")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("date_key", dateKey)
        .eq("provider", "channel_talk");
      if (clearMetricError) throw clearMetricError;
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
          last_synced_at: new Date().toISOString(),
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
