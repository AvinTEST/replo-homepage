-- Public homepage diagnosis intake schema.
-- Customer portal and dashboard schemas are maintained on the dev branch.

create table if not exists public.diagnosis_responses (
  id uuid primary key default gen_random_uuid(),
  business_type text not null,
  monthly_inquiries text not null,
  main_pain text not null,
  company_name text not null,
  website_url text not null,
  contact_name text not null,
  phone text not null,
  work_email text not null,
  source text not null default 'homepage',
  status text not null default 'new',
  webhook_status text not null default 'pending',
  webhook_sent_at timestamptz,
  webhook_error text,
  created_at timestamptz not null default now()
);

alter table public.diagnosis_responses
add column if not exists website_url text,
add column if not exists webhook_status text default 'pending',
add column if not exists webhook_sent_at timestamptz,
add column if not exists webhook_error text;

alter table public.diagnosis_responses enable row level security;

drop policy if exists "Allow public diagnosis form insert"
on public.diagnosis_responses;

revoke all on public.diagnosis_responses from anon, authenticated;
grant all on public.diagnosis_responses to service_role;
