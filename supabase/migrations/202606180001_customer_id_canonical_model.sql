create extension if not exists pgcrypto;
create schema if not exists private;

-- public.users is the canonical service-user profile, replacing public.profiles.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.users (id, name, email, avatar_url, created_at, updated_at)
select
  p.user_id,
  p.name,
  p.email,
  p.avatar_url,
  p.created_at,
  p.updated_at
from public.profiles p
on conflict (id) do update
set
  name = coalesce(excluded.name, public.users.name),
  email = excluded.email,
  avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
  updated_at = greatest(public.users.updated_at, excluded.updated_at);

insert into public.users (id, name, email, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.email,
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where u.email is not null
on conflict (id) do update
set
  email = excluded.email,
  name = coalesce(public.users.name, excluded.name),
  avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
  updated_at = now();

alter table public.workspaces
  add column if not exists timezone text not null default 'Asia/Seoul';

update public.workspaces workspace
set
  timezone = coalesce(tenant.timezone, workspace.timezone, 'Asia/Seoul'),
  updated_at = now()
from public.tenants tenant
where workspace.tenant_id = tenant.id;

alter table public.subscriptions
  add column if not exists included_tickets integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

insert into public.subscriptions (
  workspace_id,
  plan_name,
  monthly_fee,
  included_tickets,
  status,
  created_at,
  updated_at
)
select
  workspace.id,
  coalesce(tenant.plan_name, 'Basic'),
  0,
  coalesce(tenant.monthly_plan_limit, 0),
  'active',
  now(),
  now()
from public.workspaces workspace
join public.tenants tenant on tenant.id = workspace.tenant_id
where not exists (
  select 1
  from public.subscriptions existing
  where existing.workspace_id = workspace.id
);

-- tenant_users.role='manager' is mapped to workspace_members.role='editor'.
-- Manager previously had integration/sync access but was not treated as owner/admin;
-- editor is the least-privileged writable role in the canonical role set.
insert into public.workspace_members (workspace_id, user_id, role, status, created_at, updated_at)
select
  workspace.id,
  tenant_user.user_id,
  case tenant_user.role
    when 'owner' then 'owner'
    when 'admin' then 'admin'
    when 'manager' then 'editor'
    else 'viewer'
  end,
  'active',
  tenant_user.created_at,
  now()
from public.tenant_users tenant_user
join public.workspaces workspace on workspace.tenant_id = tenant_user.tenant_id
on conflict (workspace_id, user_id) do update
set
  role = excluded.role,
  status = 'active',
  updated_at = now();

update public.channel_integrations integration
set
  workspace_id = workspace.id,
  updated_at = now()
from public.workspaces workspace
where integration.workspace_id is null
  and integration.tenant_id = workspace.tenant_id;

alter table public.operation_events
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.operation_events event
set workspace_id = integration.workspace_id
from public.channel_integrations integration
where event.workspace_id is null
  and event.integration_id = integration.id
  and integration.workspace_id is not null;

update public.operation_events event
set workspace_id = workspace.id
from public.workspaces workspace
where event.workspace_id is null
  and event.tenant_id = workspace.tenant_id;

alter table public.daily_operation_metrics
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.daily_operation_metrics metric
set workspace_id = workspace.id
from public.workspaces workspace
where metric.workspace_id is null
  and metric.tenant_id = workspace.tenant_id;

alter table public.sync_jobs
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.sync_jobs job
set workspace_id = integration.workspace_id
from public.channel_integrations integration
where job.workspace_id is null
  and job.integration_id = integration.id
  and integration.workspace_id is not null;

update public.sync_jobs job
set workspace_id = workspace.id
from public.workspaces workspace
where job.workspace_id is null
  and job.tenant_id = workspace.tenant_id;

alter table public.billing_task_rules
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.billing_task_rules rule
set workspace_id = workspace.id
from public.workspaces workspace
where rule.workspace_id is null
  and rule.tenant_id = workspace.tenant_id;

create index if not exists users_email_idx on public.users(lower(email));
create index if not exists channel_integrations_workspace_provider_idx
  on public.channel_integrations(workspace_id, provider);
create index if not exists operation_events_workspace_date_idx
  on public.operation_events(workspace_id, date_key);
create index if not exists daily_metrics_workspace_date_idx
  on public.daily_operation_metrics(workspace_id, date_key);
create index if not exists sync_jobs_workspace_created_idx
  on public.sync_jobs(workspace_id, created_at desc);
create index if not exists billing_task_rules_workspace_idx
  on public.billing_task_rules(workspace_id);

alter table public.channel_integrations
  drop constraint if exists channel_integrations_scope_check;

alter table public.channel_integrations
  add constraint channel_integrations_scope_check
  check (workspace_id is not null) not valid;

alter table public.operation_events
  drop constraint if exists operation_events_tenant_id_provider_external_id_key,
  drop constraint if exists operation_events_integration_external_id_key;

alter table public.operation_events
  add constraint operation_events_workspace_integration_external_id_key
  unique (workspace_id, integration_id, provider, external_id);

alter table public.daily_operation_metrics
  drop constraint if exists daily_operation_metrics_tenant_id_date_key_provider_channel_task_type_key;

alter table public.daily_operation_metrics
  add constraint daily_operation_metrics_workspace_key
  unique (workspace_id, date_key, provider, channel, task_type);

alter table public.billing_task_rules
  drop constraint if exists billing_task_rules_tenant_id_provider_channel_task_type_key;

alter table public.billing_task_rules
  add constraint billing_task_rules_workspace_key
  unique (workspace_id, provider, channel, task_type);

create or replace function private.workspace_role(target_workspace uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.workspace_members
  where workspace_id = target_workspace
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.workspace_role(target_workspace) is not null;
$$;

create or replace function private.can_read_workspace(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.workspace_role(target_workspace) in ('owner', 'admin', 'editor', 'viewer'), false);
$$;

create or replace function private.can_edit_workspace_data(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.workspace_role(target_workspace) in ('owner', 'admin', 'editor'), false);
$$;

create or replace function private.can_manage_workspace(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.workspace_role(target_workspace) in ('owner', 'admin'), false);
$$;

grant execute on function private.workspace_role(uuid) to authenticated, service_role;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function private.can_read_workspace(uuid) to authenticated, service_role;
grant execute on function private.can_edit_workspace_data(uuid) to authenticated, service_role;
grant execute on function private.can_manage_workspace(uuid) to authenticated, service_role;

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.member_invites enable row level security;
alter table public.brands enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.billing_events enable row level security;
alter table public.channel_integrations enable row level security;
alter table public.operation_events enable row level security;
alter table public.daily_operation_metrics enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.billing_task_rules enable row level security;
alter table public.integration_consents enable row level security;
alter table public.audit_logs enable row level security;

-- Drop every legacy policy (customer- and tenant-named) so the customer-named
-- helper functions can be dropped and replaced by the workspace-named set.
drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "members can read customer" on public.workspaces;
drop policy if exists "managers can update customer" on public.workspaces;
drop policy if exists "members can read memberships" on public.workspace_members;
drop policy if exists "managers can read invites" on public.member_invites;
drop policy if exists "members can read brands" on public.brands;
drop policy if exists "managers can manage brands" on public.brands;
drop policy if exists "managers can insert brands" on public.brands;
drop policy if exists "managers can update brands" on public.brands;
drop policy if exists "managers can delete brands" on public.brands;
drop policy if exists "members can read subscriptions" on public.subscriptions;
drop policy if exists "members can read payment methods" on public.payment_methods;
drop policy if exists "members can read billing events" on public.billing_events;
drop policy if exists "members can read integration consents" on public.integration_consents;
drop policy if exists "members can read audit logs" on public.audit_logs;

drop function if exists private.is_customer_member(uuid);
drop function if exists private.can_manage_customer(uuid);
drop function if exists private.customer_role(uuid);

create policy "users can read own user"
on public.users for select to authenticated
using (id = (select auth.uid()));
create policy "users can update own user"
on public.users for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "members can read workspace"
on public.workspaces for select to authenticated
using (private.can_read_workspace(id));
create policy "owners and admins can update workspace"
on public.workspaces for update to authenticated
using (private.can_manage_workspace(id))
with check (private.can_manage_workspace(id));

create policy "members can view workspace memberships"
on public.workspace_members for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "owners and admins can manage workspace memberships"
on public.workspace_members for all to authenticated
using (private.can_manage_workspace(workspace_id))
with check (private.can_manage_workspace(workspace_id));

create policy "owners and admins can read member invites"
on public.member_invites for select to authenticated
using (private.can_manage_workspace(workspace_id));
create policy "owners and admins can manage member invites"
on public.member_invites for all to authenticated
using (private.can_manage_workspace(workspace_id))
with check (private.can_manage_workspace(workspace_id));

create policy "members can read brands"
on public.brands for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage brands"
on public.brands for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read subscriptions"
on public.subscriptions for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "owners and admins can manage subscriptions"
on public.subscriptions for all to authenticated
using (private.can_manage_workspace(workspace_id))
with check (private.can_manage_workspace(workspace_id));

create policy "members can read payment methods"
on public.payment_methods for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "owners and admins can manage payment methods"
on public.payment_methods for all to authenticated
using (private.can_manage_workspace(workspace_id))
with check (private.can_manage_workspace(workspace_id));

create policy "members can read billing events"
on public.billing_events for select to authenticated
using (private.can_read_workspace(workspace_id));

create policy "members can read operation events"
on public.operation_events for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage operation events"
on public.operation_events for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read daily metrics"
on public.daily_operation_metrics for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage daily metrics"
on public.daily_operation_metrics for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read sync jobs"
on public.sync_jobs for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage sync jobs"
on public.sync_jobs for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read billing task rules"
on public.billing_task_rules for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage billing task rules"
on public.billing_task_rules for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read integration consents"
on public.integration_consents for select to authenticated
using (private.can_read_workspace(workspace_id));
create policy "editors can manage integration consents"
on public.integration_consents for all to authenticated
using (private.can_edit_workspace_data(workspace_id))
with check (private.can_edit_workspace_data(workspace_id));

create policy "members can read audit logs"
on public.audit_logs for select to authenticated
using (private.can_read_workspace(workspace_id));

-- Do not grant direct authenticated table access to channel_integrations because
-- it contains encrypted credentials. Server routes use service_role and the same
-- workspace_members role checks before accessing this table.
revoke all on public.channel_integrations from anon, authenticated;

-- The legacy customer-named function returned (customer_id, tenant_id, brand_id).
-- RETURNS TABLE columns are OUT parameters and Postgres rejects changing them via
-- CREATE OR REPLACE, so drop the old function before defining the workspace one.
drop function if exists public.initialize_customer_workspace(
  uuid, text, text, text, text, text, text, text, text
);

create or replace function public.initialize_workspace(
  p_user_id uuid,
  p_email text,
  p_company_name text,
  p_representative_name text,
  p_business_number text,
  p_billing_email text,
  p_brand_name text,
  p_website_url text,
  p_avatar_url text
)
returns table(workspace_id uuid, brand_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_workspace_id uuid;
  existing_brand_id uuid;
  created_workspace_id uuid;
  created_brand_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select member.workspace_id
  into existing_workspace_id
  from public.workspace_members member
  where member.user_id = p_user_id
    and member.status = 'active'
  order by member.created_at
  limit 1;

  if existing_workspace_id is not null then
    select brand.id
    into existing_brand_id
    from public.brands brand
    where brand.workspace_id = existing_workspace_id
    order by brand.created_at
    limit 1;

    return query select existing_workspace_id, existing_brand_id;
    return;
  end if;

  insert into public.workspaces (
    user_id,
    company_name,
    contact_name,
    representative_name,
    business_number,
    billing_email,
    website_url,
    email,
    status,
    timezone
  )
  values (
    p_user_id,
    p_company_name,
    p_representative_name,
    p_representative_name,
    nullif(p_business_number, ''),
    coalesce(nullif(p_billing_email, ''), p_email),
    nullif(p_website_url, ''),
    p_email,
    'pending_plan',
    'Asia/Seoul'
  )
  returning id into created_workspace_id;

  insert into public.users (id, name, email, avatar_url, updated_at)
  values (p_user_id, p_representative_name, p_email, nullif(p_avatar_url, ''), now())
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();

  insert into public.workspace_members (workspace_id, user_id, role, status, last_seen_at)
  values (created_workspace_id, p_user_id, 'owner', 'active', now());

  insert into public.brands (workspace_id, name, website_url, status)
  values (created_workspace_id, p_brand_name, nullif(p_website_url, ''), 'active')
  returning id into created_brand_id;

  insert into public.subscriptions (workspace_id, plan_name, monthly_fee, included_tickets, status)
  values (created_workspace_id, 'free', 0, 0, 'active');

  insert into public.audit_logs (
    workspace_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    created_workspace_id,
    p_user_id,
    'workspace.created',
    'workspace',
    created_workspace_id,
    jsonb_build_object('brand_name', p_brand_name)
  );

  return query select created_workspace_id, created_brand_id;
end;
$$;

revoke all on function public.initialize_workspace(
  uuid, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.initialize_workspace(
  uuid, text, text, text, text, text, text, text, text
) to service_role;

-- Deferred cleanup after dev verification:
-- 1. Validate no rows have null workspace_id in canonical business tables.
-- 2. Validate code no longer reads tenant_id/tenants/tenant_users/profiles.
-- 3. Drop tenant_id columns, then drop public.tenant_users and public.tenants.
-- 4. Drop public.profiles after any external consumers switch to public.users.
