-- Admin público de TramiPago: SOLO instalar en Supabase injimzsxbnawnekybfpm,
-- tras validar esquema real, permisos y copia restaurable. No instalar en V3.
-- Consulta p_ids=[]: chequeo de disponibilidad sin borrado.
create or replace function public.admin_delete_test_requests(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare expected_count integer; locked_count integer; deleted_count integer;
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt()->>'aal'),'') <> 'aal2'
    or not exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  then raise exception 'admin_mfa_required'; end if;
  if p_ids is null or cardinality(p_ids)>100 then raise exception 'invalid_ids_count'; end if;
  if cardinality(p_ids)=0 then return 0; end if;
  select count(distinct x.id) into expected_count from unnest(p_ids) as x(id) where x.id is not null;
  if expected_count<>cardinality(p_ids) then raise exception 'duplicate_or_null_ids'; end if;
  select count(*) into locked_count from
    (select r.id from public.requests r where r.id=any(p_ids) for update) as locked;
  if locked_count<>expected_count then raise exception 'request_not_found'; end if;
  if exists(select 1 from public.requests r where r.id=any(p_ids)
    and (r.status::text not in ('draft','awaiting_payment','cancelled')
      or r.paid_at is not null or r.receipt_uploaded_at is not null))
  then raise exception 'only_unpaid_tests_can_be_deleted'; end if;
  if exists(select 1 from public.request_files f where f.request_id=any(p_ids))
  then raise exception 'request_has_private_files'; end if;
  delete from public.requests r where r.id=any(p_ids);
  get diagnostics deleted_count=row_count;
  if deleted_count<>expected_count then raise exception 'incomplete_delete'; end if;
  return deleted_count;
end;
$$;
revoke all on function public.admin_delete_test_requests(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_delete_test_requests(uuid[]) to authenticated;
comment on function public.admin_delete_test_requests(uuid[]) is 'Solo pruebas sin pagos ni archivos; exige administrador y MFA AAL2.';
