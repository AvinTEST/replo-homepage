create extension if not exists pgcrypto;
create schema if not exists private;

alter table public.customers
  alter column user_id drop not null,
  add column if not exists business_number text,
  add column if not exists billing_email text,
  add column if not exists representative_name text;

drop index if exists public.customers_user_id_key;
create unique index if not exists customers_legacy_user_id_key
  on public.customers(user_id)
  where user_id is not null;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.customer_members (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, user_id)
);

create table if not exists public.member_invites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, email)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  website_url text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, name)
);

create table if not exists public.channel_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
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

alter table public.channel_integrations
  alter column tenant_id drop not null,
  add column if not exists customer_id uuid references public.customers(id) on delete cascade,
  add column if not exists brand_id uuid references public.brands(id) on delete cascade,
  add column if not exists channel_name text,
  add column if not exists access_key_masked text,
  add column if not exists access_key_encrypted text,
  add column if not exists access_secret_encrypted text,
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.channel_integrations
  drop constraint if exists channel_integrations_scope_check;
alter table public.channel_integrations
  add constraint channel_integrations_scope_check
  check (
    (tenant_id is not null and customer_id is null)
    or
    (tenant_id is null and customer_id is not null and brand_id is not null)
  ) not valid;

create index if not exists channel_integrations_customer_idx
  on public.channel_integrations(customer_id, provider, status);
create index if not exists channel_integrations_brand_idx
  on public.channel_integrations(brand_id);

create table if not exists public.integration_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  integration_id uuid not null references public.channel_integrations(id) on delete cascade,
  consent_type text not null,
  agreed_by uuid not null references auth.users(id) on delete cascade,
  agreed_at timestamptz not null default now(),
  ip_address inet,
  unique (integration_id, consent_type)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_members_user_idx
  on public.customer_members(user_id, status);
create index if not exists customer_members_customer_idx
  on public.customer_members(customer_id, status);
create index if not exists brands_customer_idx
  on public.brands(customer_id, status);
create index if not exists audit_logs_customer_created_idx
  on public.audit_logs(customer_id, created_at desc);

insert into public.profiles (user_id, name, email)
select
  c.user_id,
  nullif(c.contact_name, ''),
  coalesce(c.email, u.email, 'unknown+' || c.user_id::text || '@invalid.local')
from public.customers c
left join auth.users u on u.id = c.user_id
where c.user_id is not null
on conflict (user_id) do update
set
  name = coalesce(public.profiles.name, excluded.name),
  email = excluded.email,
  updated_at = now();

insert into public.customer_members (customer_id, user_id, role, status)
select c.id, c.user_id, 'owner', 'active'
from public.customers c
where c.user_id is not null
on conflict (customer_id, user_id) do nothing;

create or replace function private.customer_role(target_customer uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.customer_members
  where customer_id = target_customer
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function private.is_customer_member(target_customer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.customer_role(target_customer) is not null;
$$;

create or replace function private.can_manage_customer(target_customer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.customer_role(target_customer) in ('owner', 'admin'), false);
$$;

create or replace function private.enforce_channel_talk_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.customer_id is null
    or new.provider <> 'channel_talk'
    or new.status <> 'connected' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.customer_id::text));

  select count(*)
  into active_count
  from public.channel_integrations
  where customer_id = new.customer_id
    and provider = 'channel_talk'
    and status = 'connected'
    and id <> new.id;

  if active_count >= 10 then
    raise exception 'A customer can have at most 10 active ChannelTalk integrations';
  end if;

  return new;
end;
$$;

drop trigger if exists channel_talk_limit_trigger on public.channel_integrations;
create trigger channel_talk_limit_trigger
before insert or update of customer_id, provider, status
on public.channel_integrations
for each row execute function private.enforce_channel_talk_limit();

alter table public.profiles enable row level security;
alter table public.customer_members enable row level security;
alter table public.member_invites enable row level security;
alter table public.brands enable row level security;
alter table public.integration_consents enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Customers can read own customer record" on public.customers;
drop policy if exists "Customers can create own customer record" on public.customers;
drop policy if exists "Customers can update own customer record" on public.customers;
create policy "members can read customer"
on public.customers for select to authenticated
using (private.is_customer_member(id));
create policy "managers can update customer"
on public.customers for update to authenticated
using (private.can_manage_customer(id))
with check (private.can_manage_customer(id));

create policy "users can read own profile"
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));
create policy "users can update own profile"
on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "members can read memberships"
on public.customer_members for select to authenticated
using (private.is_customer_member(customer_id));

create policy "managers can read invites"
on public.member_invites for select to authenticated
using (private.can_manage_customer(customer_id));

create policy "members can read brands"
on public.brands for select to authenticated
using (private.is_customer_member(customer_id));
create policy "managers can manage brands"
on public.brands for all to authenticated
using (private.can_manage_customer(customer_id))
with check (private.can_manage_customer(customer_id));

create policy "members can read integration consents"
on public.integration_consents for select to authenticated
using (private.is_customer_member(customer_id));

create policy "members can read audit logs"
on public.audit_logs for select to authenticated
using (private.is_customer_member(customer_id));

drop policy if exists "Customers can read own subscriptions" on public.subscriptions;
create policy "members can read subscriptions"
on public.subscriptions for select to authenticated
using (private.is_customer_member(customer_id));

drop policy if exists "Customers can read own payment methods" on public.payment_methods;
create policy "members can read payment methods"
on public.payment_methods for select to authenticated
using (private.is_customer_member(customer_id));

drop policy if exists "Customers can read own billing events" on public.billing_events;
drop policy if exists "Customers can create own billing events" on public.billing_events;
create policy "members can read billing events"
on public.billing_events for select to authenticated
using (private.is_customer_member(customer_id));

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.customer_role(uuid) to authenticated, service_role;
grant execute on function private.is_customer_member(uuid) to authenticated, service_role;
grant execute on function private.can_manage_customer(uuid) to authenticated, service_role;

revoke all on public.channel_integrations from anon, authenticated;
grant select on public.profiles, public.customer_members, public.member_invites,
  public.brands, public.integration_consents, public.audit_logs to authenticated;
grant update on public.profiles to authenticated;
grant insert, update, delete on public.brands to authenticated;

grant all on public.profiles, public.customer_members, public.member_invites,
  public.brands, public.channel_integrations, public.integration_consents,
  public.audit_logs to service_role;
