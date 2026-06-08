create table if not exists public.diagnosis_responses (
  id uuid primary key default gen_random_uuid(),
  business_type text not null,
  monthly_inquiries text not null,
  main_pain text not null,
  company_name text not null,
  contact_name text not null,
  phone text not null,
  work_email text not null,
  source text default 'homepage',
  status text default 'new',
  webhook_status text default 'pending',
  webhook_sent_at timestamp with time zone,
  webhook_error text,
  created_at timestamp with time zone default now()
);

alter table public.diagnosis_responses
add column if not exists webhook_status text default 'pending',
add column if not exists webhook_sent_at timestamp with time zone,
add column if not exists webhook_error text;

alter table public.diagnosis_responses enable row level security;

drop policy if exists "Allow public diagnosis form insert"
on public.diagnosis_responses;

create policy "Allow public diagnosis form insert"
on public.diagnosis_responses
for insert
to anon
with check (true);

alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "Customers can read own customer record"
on public.customers;

create policy "Customers can read own customer record"
on public.customers
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Customers can read own subscriptions"
on public.subscriptions;

create policy "Customers can read own subscriptions"
on public.subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = subscriptions.customer_id
      and customers.user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own payment methods"
on public.payment_methods;

create policy "Customers can read own payment methods"
on public.payment_methods
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = payment_methods.customer_id
      and customers.user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own billing events"
on public.billing_events;

create policy "Customers can read own billing events"
on public.billing_events
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = billing_events.customer_id
      and customers.user_id = auth.uid()
  )
);

drop policy if exists "Customers can create own billing events"
on public.billing_events;

create policy "Customers can create own billing events"
on public.billing_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = billing_events.customer_id
      and customers.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.id = billing_events.subscription_id
      and subscriptions.customer_id = billing_events.customer_id
  )
);
