do $$
begin
  if exists (select 1 from public.channel_integrations where workspace_id is null) then
    raise exception 'cleanup_blocked_channel_integrations_workspace_id_null';
  end if;
  if exists (select 1 from public.operation_events where workspace_id is null) then
    raise exception 'cleanup_blocked_operation_events_workspace_id_null';
  end if;
  if exists (select 1 from public.daily_operation_metrics where workspace_id is null) then
    raise exception 'cleanup_blocked_daily_operation_metrics_workspace_id_null';
  end if;
  if exists (select 1 from public.sync_jobs where workspace_id is null) then
    raise exception 'cleanup_blocked_sync_jobs_workspace_id_null';
  end if;
  if exists (select 1 from public.billing_task_rules where workspace_id is null) then
    raise exception 'cleanup_blocked_billing_task_rules_workspace_id_null';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.profiles profile
    where not exists (
      select 1
      from public.users app_user
      where app_user.id = profile.user_id
    )
  ) then
    raise exception 'cleanup_blocked_profiles_not_backfilled';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.tenant_users tenant_user
    join public.workspaces workspace on workspace.tenant_id = tenant_user.tenant_id
    where not exists (
      select 1
      from public.workspace_members member
      where member.workspace_id = workspace.id
        and member.user_id = tenant_user.user_id
    )
  ) then
    raise exception 'cleanup_blocked_tenant_users_not_backfilled';
  end if;
end;
$$;

drop policy if exists "tenant users can view events" on public.operation_events;
drop policy if exists "tenant users can view metrics" on public.daily_operation_metrics;
drop policy if exists "tenant users can view sync jobs" on public.sync_jobs;
drop policy if exists "tenant users can view billing rules" on public.billing_task_rules;
drop policy if exists "tenant users can view tenants" on public.tenants;
drop policy if exists "users can view memberships" on public.tenant_users;

-- The customer_members -> tenant_users bridge was already removed in
-- 202606180000; these drops are idempotent safety nets.
drop trigger if exists customer_member_tenant_user_trigger on public.workspace_members;
drop function if exists private.sync_customer_member_tenant_user();
drop function if exists public.is_tenant_user(uuid);

-- Index and constraint names keep their original "customers"/"tenant" spelling
-- because ALTER ... RENAME does not rename dependent indexes/constraints.
drop index if exists public.customers_tenant_id_key;
drop index if exists public.tenant_users_user_idx;
drop index if exists public.operation_events_tenant_date_idx;
drop index if exists public.daily_metrics_tenant_date_idx;
drop index if exists public.sync_jobs_tenant_created_idx;
drop index if exists public.channel_integrations_tenant_provider_legacy_key;

alter table public.channel_integrations
  alter column workspace_id set not null,
  drop constraint if exists channel_integrations_scope_check,
  drop constraint if exists channel_integrations_tenant_id_provider_key,
  drop column if exists tenant_id;

alter table public.channel_integrations
  add constraint channel_integrations_scope_check
  check (workspace_id is not null);

alter table public.operation_events
  alter column workspace_id set not null,
  drop constraint if exists operation_events_tenant_id_provider_external_id_key,
  drop column if exists tenant_id;

alter table public.daily_operation_metrics
  alter column workspace_id set not null,
  drop constraint if exists daily_operation_metrics_tenant_id_date_key_provider_channel_task_type_key,
  drop column if exists tenant_id;

alter table public.sync_jobs
  alter column workspace_id set not null,
  drop column if exists tenant_id;

alter table public.billing_task_rules
  alter column workspace_id set not null,
  drop constraint if exists billing_task_rules_tenant_id_provider_channel_task_type_key,
  drop column if exists tenant_id;

alter table public.workspaces
  drop constraint if exists customers_tenant_id_fkey,
  drop column if exists tenant_id;

drop table if exists public.tenant_users;
drop table if exists public.tenants;
drop table if exists public.profiles;
