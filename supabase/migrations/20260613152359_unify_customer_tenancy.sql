create extension if not exists pgcrypto;
create schema if not exists private;

alter table public.customers
  add column if not exists tenant_id uuid references public.tenants(id) on delete restrict;

create unique index if not exists customers_tenant_id_key
  on public.customers(tenant_id)
  where tenant_id is not null;

-- Reuse a legacy tenant only when the active membership relationship is
-- unambiguous in both directions.
with membership_pairs as (
  select distinct cm.customer_id, tu.tenant_id
  from public.customer_members cm
  join public.tenant_users tu on tu.user_id = cm.user_id
  where cm.status = 'active'
),
eligible_pairs as (
  select pair.customer_id, pair.tenant_id
  from membership_pairs pair
  where (
    select count(*)
    from membership_pairs by_customer
    where by_customer.customer_id = pair.customer_id
  ) = 1
  and (
    select count(*)
    from membership_pairs by_tenant
    where by_tenant.tenant_id = pair.tenant_id
  ) = 1
)
update public.customers customer
set tenant_id = eligible.tenant_id,
    updated_at = now()
from eligible_pairs eligible
where customer.id = eligible.customer_id
  and customer.tenant_id is null
  and not exists (
    select 1
    from public.customers claimed
    where claimed.tenant_id = eligible.tenant_id
  );

do $$
declare
  customer record;
  created_tenant_id uuid;
  subscription_plan_name text;
  subscription_included_tickets integer;
begin
  for customer in
    select id, company_name
    from public.customers
    where tenant_id is null
    order by created_at, id
    for update
  loop
    subscription_plan_name := null;
    subscription_included_tickets := null;

    select plan_name, included_tickets
    into subscription_plan_name, subscription_included_tickets
    from public.subscriptions
    where customer_id = customer.id
    order by created_at desc
    limit 1;

    insert into public.tenants (
      company_name,
      display_name,
      plan_name,
      monthly_plan_limit,
      timezone
    )
    values (
      customer.company_name,
      customer.company_name,
      coalesce(subscription_plan_name, 'Basic'),
      coalesce(subscription_included_tickets, 0),
      'Asia/Seoul'
    )
    returning id into created_tenant_id;

    update public.customers
    set tenant_id = created_tenant_id,
        updated_at = now()
    where id = customer.id;
  end loop;
end;
$$;

alter table public.customers
  alter column tenant_id set not null;

insert into public.tenant_users (tenant_id, user_id, role)
select
  customer.tenant_id,
  member.user_id,
  case member.role
    when 'owner' then 'owner'
    when 'admin' then 'admin'
    when 'editor' then 'manager'
    else 'viewer'
  end
from public.customer_members member
join public.customers customer on customer.id = member.customer_id
where member.status = 'active'
on conflict (tenant_id, user_id) do update
set role = excluded.role;

create or replace function private.sync_customer_member_tenant_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_tenant uuid;
  target_role text;
begin
  if tg_op = 'DELETE' then
    select tenant_id
    into target_tenant
    from public.customers
    where id = old.customer_id;

    delete from public.tenant_users
    where tenant_id = target_tenant
      and user_id = old.user_id;
    return old;
  end if;

  if tg_op = 'UPDATE'
    and (old.customer_id, old.user_id) is distinct from (new.customer_id, new.user_id) then
    select tenant_id
    into target_tenant
    from public.customers
    where id = old.customer_id;

    delete from public.tenant_users
    where tenant_id = target_tenant
      and user_id = old.user_id;
  end if;

  select tenant_id
  into target_tenant
  from public.customers
  where id = new.customer_id;

  if target_tenant is null then
    raise exception 'customer_has_no_tenant';
  end if;

  if new.status <> 'active' then
    delete from public.tenant_users
    where tenant_id = target_tenant
      and user_id = new.user_id;
    return new;
  end if;

  target_role := case new.role
    when 'owner' then 'owner'
    when 'admin' then 'admin'
    when 'editor' then 'manager'
    else 'viewer'
  end;

  insert into public.tenant_users (tenant_id, user_id, role)
  values (target_tenant, new.user_id, target_role)
  on conflict (tenant_id, user_id) do update
  set role = excluded.role;

  return new;
end;
$$;

drop trigger if exists customer_member_tenant_user_trigger
  on public.customer_members;
create trigger customer_member_tenant_user_trigger
after insert or update of customer_id, user_id, role, status or delete
on public.customer_members
for each row execute function private.sync_customer_member_tenant_user();

update public.channel_integrations integration
set tenant_id = customer.tenant_id,
    updated_at = now()
from public.customers customer
where integration.customer_id = customer.id
  and integration.tenant_id is null;

do $$
begin
  if exists (
    select 1 from public.channel_integrations where tenant_id is null
  ) then
    raise exception 'channel_integrations_contains_rows_without_tenant';
  end if;
end;
$$;

alter table public.channel_integrations
  alter column tenant_id set not null,
  drop constraint if exists channel_integrations_scope_check,
  drop constraint if exists channel_integrations_tenant_id_provider_key;

alter table public.channel_integrations
  add constraint channel_integrations_scope_check
  check (
    tenant_id is not null
    and (
      (customer_id is null and brand_id is null)
      or
      (customer_id is not null and brand_id is not null)
    )
  );

create unique index if not exists channel_integrations_tenant_provider_legacy_key
  on public.channel_integrations(tenant_id, provider)
  where customer_id is null;

alter table public.operation_events
  drop constraint if exists operation_events_tenant_id_provider_external_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.operation_events'::regclass
      and conname = 'operation_events_integration_external_id_key'
  ) then
    alter table public.operation_events
      add constraint operation_events_integration_external_id_key
      unique (tenant_id, integration_id, provider, external_id);
  end if;
end;
$$;

create or replace function public.initialize_customer_workspace(
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
returns table(customer_id uuid, tenant_id uuid, brand_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_customer_id uuid;
  existing_tenant_id uuid;
  existing_brand_id uuid;
  created_customer_id uuid;
  created_tenant_id uuid;
  created_brand_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select member.customer_id, customer.tenant_id
  into existing_customer_id, existing_tenant_id
  from public.customer_members member
  join public.customers customer on customer.id = member.customer_id
  where member.user_id = p_user_id
    and member.status = 'active'
  order by member.created_at
  limit 1;

  if existing_customer_id is not null then
    select brand.id
    into existing_brand_id
    from public.brands brand
    where brand.customer_id = existing_customer_id
    order by brand.created_at
    limit 1;

    return query
    select existing_customer_id, existing_tenant_id, existing_brand_id;
    return;
  end if;

  insert into public.tenants (
    company_name,
    display_name,
    plan_name,
    monthly_plan_limit,
    timezone
  )
  values (p_company_name, p_company_name, 'Basic', 0, 'Asia/Seoul')
  returning id into created_tenant_id;

  insert into public.customers (
    user_id,
    tenant_id,
    company_name,
    contact_name,
    representative_name,
    business_number,
    billing_email,
    website_url,
    email,
    status
  )
  values (
    p_user_id,
    created_tenant_id,
    p_company_name,
    p_representative_name,
    p_representative_name,
    nullif(p_business_number, ''),
    coalesce(nullif(p_billing_email, ''), p_email),
    nullif(p_website_url, ''),
    p_email,
    'pending_plan'
  )
  returning id into created_customer_id;

  insert into public.customer_members (
    customer_id,
    user_id,
    role,
    status,
    last_seen_at
  )
  values (created_customer_id, p_user_id, 'owner', 'active', now());

  insert into public.brands (customer_id, name, website_url, status)
  values (
    created_customer_id,
    p_brand_name,
    nullif(p_website_url, ''),
    'active'
  )
  returning id into created_brand_id;

  insert into public.profiles (user_id, name, email, avatar_url, updated_at)
  values (
    p_user_id,
    p_representative_name,
    p_email,
    nullif(p_avatar_url, ''),
    now()
  )
  on conflict (user_id) do update
  set name = excluded.name,
      email = excluded.email,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  insert into public.audit_logs (
    customer_id,
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    created_customer_id,
    p_user_id,
    'workspace.created',
    'customer',
    created_customer_id,
    jsonb_build_object('brand_name', p_brand_name, 'tenant_id', created_tenant_id)
  );

  return query
  select created_customer_id, created_tenant_id, created_brand_id;
end;
$$;

revoke all on function public.initialize_customer_workspace(
  uuid, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.initialize_customer_workspace(
  uuid, text, text, text, text, text, text, text, text
) to service_role;

revoke all on function private.sync_customer_member_tenant_user() from public;
