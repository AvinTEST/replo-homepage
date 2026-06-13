create index if not exists operation_events_integration_idx
  on public.operation_events(integration_id);
create index if not exists sync_jobs_integration_idx
  on public.sync_jobs(integration_id);
