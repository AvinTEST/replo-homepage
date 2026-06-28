-- Rename the tenancy entity from "customer" to "workspace".
--
-- Three different concepts shared the word "customer" in this codebase:
--   1. the tenancy/account entity (this rename target),
--   2. the end-consumer who contacted support (operation_events.customer_external_id),
--   3. the external Airtable "Customers" table (AIRTABLE_CUSTOMERS_TABLE_ID).
-- Only concept 1 is renamed here. Concepts 2 and 3 keep the "customer" name.
--
-- Function bodies (plpgsql/sql) resolve table and column names at call time and
-- are NOT auto-updated by ALTER ... RENAME, so every helper/trigger function that
-- references the renamed objects is repointed here in the same migration.

-- The legacy customer_members -> tenant_users bridge is abandoned. Drop it before
-- renaming so the upcoming backfill into workspace_members does not fire a trigger
-- whose body still references public.customers.
drop trigger if exists customer_member_tenant_user_trigger on public.customer_members;
drop function if exists private.sync_customer_member_tenant_user();

alter table public.customers rename to workspaces;
alter table public.customer_members rename to workspace_members;

alter table public.workspace_members rename column customer_id to workspace_id;
alter table public.member_invites rename column customer_id to workspace_id;
alter table public.brands rename column customer_id to workspace_id;
alter table public.subscriptions rename column customer_id to workspace_id;
alter table public.payment_methods rename column customer_id to workspace_id;
alter table public.billing_events rename column customer_id to workspace_id;
alter table public.channel_integrations rename column customer_id to workspace_id;
alter table public.integration_consents rename column customer_id to workspace_id;
alter table public.audit_logs rename column customer_id to workspace_id;

-- Repoint the pre-existing RLS helpers at the renamed table/column. Names are kept
-- so the policies created by earlier migrations keep working; 202606180001 replaces
-- both the helpers and the policies with workspace-named versions.
create or replace function private.customer_role(target_customer uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.workspace_members
  where workspace_id = target_customer
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

-- Repoint the ChannelTalk limit trigger function: it executes during the
-- 202606180001 backfill update on channel_integrations.
create or replace function private.enforce_channel_talk_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.workspace_id is null
    or new.provider <> 'channel_talk'
    or new.status <> 'connected' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.workspace_id::text));

  select count(*)
  into active_count
  from public.channel_integrations
  where workspace_id = new.workspace_id
    and provider = 'channel_talk'
    and status = 'connected'
    and id <> new.id;

  if active_count >= 10 then
    raise exception 'A workspace can have at most 10 active ChannelTalk integrations';
  end if;

  return new;
end;
$$;
