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
