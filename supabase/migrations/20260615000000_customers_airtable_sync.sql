-- Track Airtable mirror state on each customer row so the webhook receiver can
-- write back the result of a sync, dedupe redeliveries, and surface failures.
alter table public.customers
  add column if not exists airtable_record_id text,
  add column if not exists airtable_synced_at timestamptz,
  add column if not exists airtable_sync_error text;

-- Look up / dedupe a customer by its mirrored Airtable record id.
create unique index if not exists customers_airtable_record_id_key
  on public.customers(airtable_record_id)
  where airtable_record_id is not null;
