export type SyncTarget = {
  integrationId: string;
  tenantId: string;
};

export function validSyncTargets(
  rows: Array<{ id: unknown; tenant_id: unknown }>,
): SyncTarget[] {
  const seen = new Set<string>();
  const targets: SyncTarget[] = [];

  for (const row of rows) {
    if (typeof row.id !== "string" || typeof row.tenant_id !== "string") continue;
    const key = `${row.tenant_id}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ integrationId: row.id, tenantId: row.tenant_id });
  }

  return targets;
}
