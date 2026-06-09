create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  display_name text not null,
  plan_name text not null default 'Basic',
  monthly_plan_limit integer not null default 0 check (monthly_plan_limit >= 0),
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.channel_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null check (provider in (
    'channel_talk', 'naver_commerce', 'coupang', 'kakao_channel', 'cafe24', 'custom_sheet'
  )),
  display_name text not null,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connected', 'error', 'paused')),
  encrypted_credentials text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create table if not exists public.operation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  integration_id uuid references public.channel_integrations(id) on delete set null,
  provider text not null,
  external_id text not null,
  occurred_at timestamptz not null,
  date_key date not null,
  channel text not null,
  task_type text not null,
  direction text not null check (direction in ('inbound', 'outbound', 'internal')),
  status text,
  count integer not null default 1 check (count >= 0),
  customer_external_id text,
  assignee_name text,
  response_time_seconds integer,
  handling_time_seconds integer,
  metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider, external_id)
);

create table if not exists public.daily_operation_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date_key date not null,
  provider text not null,
  channel text not null,
  task_type text not null,
  total_count integer not null default 0,
  inbound_count integer not null default 0,
  outbound_count integer not null default 0,
  answered_count integer not null default 0,
  missed_count integer not null default 0,
  avg_response_time_seconds integer,
  avg_handling_time_seconds integer,
  billable_count numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, date_key, provider, channel, task_type)
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  integration_id uuid references public.channel_integrations(id) on delete set null,
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'success', 'failed')),
  sync_from timestamptz,
  sync_to timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  records_fetched integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_task_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null,
  channel text not null,
  task_type text not null,
  is_billable boolean not null default true,
  weight numeric(8,2) not null default 1 check (weight >= 0),
  created_at timestamptz not null default now(),
  unique (tenant_id, provider, channel, task_type)
);

create index if not exists tenant_users_user_idx on public.tenant_users(user_id);
create index if not exists operation_events_tenant_date_idx
  on public.operation_events(tenant_id, date_key);
create index if not exists daily_metrics_tenant_date_idx
  on public.daily_operation_metrics(tenant_id, date_key);
create index if not exists sync_jobs_tenant_created_idx
  on public.sync_jobs(tenant_id, created_at desc);

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.channel_integrations enable row level security;
alter table public.operation_events enable row level security;
alter table public.daily_operation_metrics enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.billing_task_rules enable row level security;

create or replace function public.is_tenant_user(target_tenant uuid)
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

revoke all on function public.is_tenant_user(uuid) from public;
grant execute on function public.is_tenant_user(uuid) to authenticated;

drop policy if exists "tenant users can view tenants" on public.tenants;
create policy "tenant users can view tenants"
on public.tenants for select to authenticated
using (public.is_tenant_user(id));

drop policy if exists "users can view memberships" on public.tenant_users;
create policy "users can view memberships"
on public.tenant_users for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "tenant users can view events" on public.operation_events;
create policy "tenant users can view events"
on public.operation_events for select to authenticated
using (public.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view metrics" on public.daily_operation_metrics;
create policy "tenant users can view metrics"
on public.daily_operation_metrics for select to authenticated
using (public.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view sync jobs" on public.sync_jobs;
create policy "tenant users can view sync jobs"
on public.sync_jobs for select to authenticated
using (public.is_tenant_user(tenant_id));

drop policy if exists "tenant users can view billing rules" on public.billing_task_rules;
create policy "tenant users can view billing rules"
on public.billing_task_rules for select to authenticated
using (public.is_tenant_user(tenant_id));

-- channel_integrations에는 암호화된 비밀값이 있으므로 authenticated 역할에
-- 직접 SELECT 정책을 만들지 않는다. 검증된 서버 Route Handler만 service role로 접근한다.
revoke all on public.channel_integrations from anon, authenticated;
grant select on public.tenants, public.tenant_users, public.operation_events,
  public.daily_operation_metrics, public.sync_jobs, public.billing_task_rules
to authenticated;

grant all on public.tenants, public.tenant_users, public.channel_integrations,
  public.operation_events, public.daily_operation_metrics, public.sync_jobs,
  public.billing_task_rules
to service_role;
