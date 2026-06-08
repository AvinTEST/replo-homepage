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
