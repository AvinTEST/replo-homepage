export type SyncTarget = {
  integrationId: string;
  workspaceId: string;
};

export function validSyncTargets(
  rows: Array<{ id: unknown; workspace_id: unknown }>,
): SyncTarget[] {
  const seen = new Set<string>();
  const targets: SyncTarget[] = [];

  for (const row of rows) {
    if (typeof row.id !== "string" || typeof row.workspace_id !== "string") continue;
    const key = `${row.workspace_id}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ integrationId: row.id, workspaceId: row.workspace_id });
  }

  return targets;
}
