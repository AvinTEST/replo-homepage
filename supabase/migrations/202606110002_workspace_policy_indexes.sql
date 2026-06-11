drop policy if exists "managers can manage brands" on public.brands;
create policy "managers can insert brands"
on public.brands for insert to authenticated
with check (private.can_manage_customer(customer_id));
create policy "managers can update brands"
on public.brands for update to authenticated
using (private.can_manage_customer(customer_id))
with check (private.can_manage_customer(customer_id));
create policy "managers can delete brands"
on public.brands for delete to authenticated
using (private.can_manage_customer(customer_id));

create index if not exists audit_logs_actor_user_idx
  on public.audit_logs(actor_user_id);
create index if not exists channel_integrations_created_by_idx
  on public.channel_integrations(created_by);
create index if not exists customer_members_invited_by_idx
  on public.customer_members(invited_by);
create index if not exists integration_consents_agreed_by_idx
  on public.integration_consents(agreed_by);
create index if not exists integration_consents_customer_idx
  on public.integration_consents(customer_id);
create index if not exists member_invites_invited_by_idx
  on public.member_invites(invited_by);
