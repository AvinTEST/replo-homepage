alter table public.customers
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

create unique index if not exists customers_tenant_id_key
  on public.customers(tenant_id)
  where tenant_id is not null;

alter table public.channel_integrations
  drop constraint if exists channel_integrations_tenant_id_provider_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'channel_integrations_tenant_id_fkey'
      and conrelid = 'public.channel_integrations'::regclass
  ) then
    alter table public.channel_integrations
      add constraint channel_integrations_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end;
$$;

alter table public.channel_integrations
  drop constraint if exists channel_integrations_scope_check;
alter table public.channel_integrations
  add constraint channel_integrations_scope_check
  check (
    (tenant_id is not null and customer_id is null and brand_id is null)
    or
    (customer_id is not null and brand_id is not null)
  ) not valid;

create unique index if not exists channel_integrations_tenant_provider_legacy_key
  on public.channel_integrations(tenant_id, provider)
  where customer_id is null;

alter table public.operation_events
  drop constraint if exists operation_events_tenant_id_provider_external_id_key;
alter table public.operation_events
  add constraint operation_events_integration_external_id_key
  unique (tenant_id, integration_id, provider, external_id);

alter table public.channel_integrations enable row level security;
revoke all on public.channel_integrations from anon, authenticated;
grant all on public.channel_integrations to service_role;

do $$
declare
  customer_row record;
  new_tenant_id uuid;
begin
  for customer_row in
    select id, company_name
    from public.customers
    where tenant_id is null
    order by created_at
  loop
    insert into public.tenants (company_name, display_name)
    values (customer_row.company_name, customer_row.company_name)
    returning id into new_tenant_id;

    update public.customers
    set tenant_id = new_tenant_id, updated_at = now()
    where id = customer_row.id;

    insert into public.tenant_users (tenant_id, user_id, role)
    select
      new_tenant_id,
      member.user_id,
      case member.role
        when 'owner' then 'owner'
        when 'admin' then 'admin'
        when 'editor' then 'manager'
        else 'viewer'
      end
    from public.customer_members member
    where member.customer_id = customer_row.id
      and member.status = 'active'
    on conflict (tenant_id, user_id) do update
    set role = excluded.role;
  end loop;
end;
$$;

update public.channel_integrations integration
set tenant_id = customer.tenant_id
from public.customers customer
where integration.customer_id = customer.id
  and integration.tenant_id is null
  and customer.tenant_id is not null;

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
  created_customer_id uuid;
  created_tenant_id uuid;
  created_brand_id uuid;
begin
  if exists (
    select 1
    from public.customer_members
    where user_id = p_user_id
      and status = 'active'
  ) then
    raise exception 'user_already_has_workspace';
  end if;

  insert into public.tenants (company_name, display_name)
  values (p_company_name, p_company_name)
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

  insert into public.tenant_users (tenant_id, user_id, role)
  values (created_tenant_id, p_user_id, 'owner');

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
  set
    name = excluded.name,
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
    jsonb_build_object(
      'brand_name', p_brand_name,
      'tenant_id', created_tenant_id
    )
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

create or replace function public.update_customer_member_role(
  p_customer_id uuid,
  p_member_id uuid,
  p_role text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_user_id uuid;
  previous_role text;
  target_tenant_id uuid;
  tenant_role text;
begin
  if p_role not in ('owner', 'admin', 'editor', 'viewer') then
    raise exception 'invalid_role';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));

  select member.user_id, member.role, customer.tenant_id
  into target_user_id, previous_role, target_tenant_id
  from public.customer_members member
  join public.customers customer on customer.id = member.customer_id
  where member.id = p_member_id
    and member.customer_id = p_customer_id
    and member.status = 'active'
  for update of member;

  if target_user_id is null then
    raise exception 'member_not_found';
  end if;

  if previous_role = 'owner'
    and p_role <> 'owner'
    and (
      select count(*)
      from public.customer_members
      where customer_id = p_customer_id
        and role = 'owner'
        and status = 'active'
    ) <= 1 then
    raise exception 'last_owner';
  end if;

  update public.customer_members
  set role = p_role, updated_at = now()
  where id = p_member_id;

  if target_tenant_id is not null then
    tenant_role := case p_role
      when 'owner' then 'owner'
      when 'admin' then 'admin'
      when 'editor' then 'manager'
      else 'viewer'
    end;

    insert into public.tenant_users (tenant_id, user_id, role)
    values (target_tenant_id, target_user_id, tenant_role)
    on conflict (tenant_id, user_id) do update
    set role = excluded.role;
  end if;
end;
$$;

revoke all on function public.update_customer_member_role(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.update_customer_member_role(uuid, uuid, text)
  to service_role;

create or replace function public.delete_customer_member(
  p_customer_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_user_id uuid;
  target_role text;
  target_tenant_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_customer_id::text, 0));

  select member.user_id, member.role, customer.tenant_id
  into target_user_id, target_role, target_tenant_id
  from public.customer_members member
  join public.customers customer on customer.id = member.customer_id
  where member.id = p_member_id
    and member.customer_id = p_customer_id
    and member.status = 'active'
  for update of member;

  if target_user_id is null then
    raise exception 'member_not_found';
  end if;

  if target_role = 'owner'
    and (
      select count(*)
      from public.customer_members
      where customer_id = p_customer_id
        and role = 'owner'
        and status = 'active'
    ) <= 1 then
    raise exception 'last_owner';
  end if;

  if target_tenant_id is not null then
    delete from public.tenant_users
    where tenant_id = target_tenant_id
      and user_id = target_user_id;
  end if;

  delete from public.customer_members
  where id = p_member_id
    and customer_id = p_customer_id;
end;
$$;

revoke all on function public.delete_customer_member(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.delete_customer_member(uuid, uuid)
  to service_role;
