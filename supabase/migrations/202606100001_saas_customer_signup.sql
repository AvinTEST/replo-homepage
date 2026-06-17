create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  website_url text,
  email text not null,
  status text not null default 'pending_plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists website_url text,
  add column if not exists email text,
  add column if not exists status text default 'pending_plan',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists customers_user_id_key
  on public.customers(user_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  steppay_subscription_id text,
  plan_name text,
  monthly_fee numeric(12,2),
  included_tickets integer,
  next_billing_date date,
  status text default 'pending',
  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default now();

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  masked_number text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  event_type text not null,
  status text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_id_idx
  on public.subscriptions(customer_id);
create index if not exists payment_methods_customer_id_idx
  on public.payment_methods(customer_id);
create index if not exists billing_events_customer_id_idx
  on public.billing_events(customer_id);
create index if not exists billing_events_subscription_id_idx
  on public.billing_events(subscription_id);

alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "Customers can read own customer record" on public.customers;
drop policy if exists "Users can view own customer" on public.customers;
create policy "Customers can read own customer record"
on public.customers for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Customers can create own customer record" on public.customers;
create policy "Customers can create own customer record"
on public.customers for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Customers can update own customer record" on public.customers;
create policy "Customers can update own customer record"
on public.customers for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Customers can read own subscriptions" on public.subscriptions;
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Customers can read own subscriptions"
on public.subscriptions for select to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = subscriptions.customer_id
      and customers.user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can read own payment methods" on public.payment_methods;
drop policy if exists "Users can view own payment methods" on public.payment_methods;
create policy "Customers can read own payment methods"
on public.payment_methods for select to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = payment_methods.customer_id
      and customers.user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can read own billing events" on public.billing_events;
drop policy if exists "Users can view own billing events" on public.billing_events;
create policy "Customers can read own billing events"
on public.billing_events for select to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = billing_events.customer_id
      and customers.user_id = (select auth.uid())
  )
);

drop policy if exists "Customers can create own billing events" on public.billing_events;
create policy "Customers can create own billing events"
on public.billing_events for insert to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = billing_events.customer_id
      and customers.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.id = billing_events.subscription_id
      and subscriptions.customer_id = billing_events.customer_id
  )
);

grant select, insert, update on public.customers to authenticated;
grant select on public.subscriptions, public.payment_methods, public.billing_events
  to authenticated;
grant insert on public.billing_events to authenticated;

grant all on public.customers, public.subscriptions, public.payment_methods,
  public.billing_events to service_role;
