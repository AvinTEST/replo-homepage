create or replace function private.is_tenant_user(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users
    where tenant_id = target_tenant
      and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_tenant_user(uuid) from public;
grant execute on function private.is_tenant_user(uuid)
  to authenticated, service_role;

drop policy if exists "tenant users can view tenants" on public.tenants;
create policy "tenant users can view tenants"
on public.tenants for select to authenticated
using (private.is_tenant_user(id));

drop policy if exists "tenant users can view events" on public.operation_events;
create policy "tenant users can view events"
on public.operation_events for select to authenticated
using (private.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view metrics"
  on public.daily_operation_metrics;
create policy "tenant users can view metrics"
on public.daily_operation_metrics for select to authenticated
using (private.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view sync jobs" on public.sync_jobs;
create policy "tenant users can view sync jobs"
on public.sync_jobs for select to authenticated
using (private.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view billing rules"
  on public.billing_task_rules;
create policy "tenant users can view billing rules"
on public.billing_task_rules for select to authenticated
using (private.is_tenant_user(tenant_id));

drop function if exists public.is_tenant_user(uuid);
