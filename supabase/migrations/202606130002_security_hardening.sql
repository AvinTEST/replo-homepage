drop policy if exists "Allow public diagnosis form insert"
  on public.diagnosis_responses;
revoke insert on public.diagnosis_responses from anon, authenticated;
grant all on public.diagnosis_responses to service_role;

revoke execute on function public.is_tenant_user(uuid) from public, anon;
grant execute on function public.is_tenant_user(uuid) to authenticated;
