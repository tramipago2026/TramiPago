-- Fix confirmed in production on 2026-10-01.
-- The Admin tariff query was authenticated and protected by RLS, but the
-- authenticated role had no table-level SELECT grant, causing:
--   permission denied for table service_price_options
--
-- Keep least privilege: Admin may only read this table from the browser.
-- RLS still requires public.is_admin(), which in turn requires aal2.

revoke all on table public.service_price_options from anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.service_price_options from authenticated;

grant select on table public.service_price_options to authenticated;

drop policy if exists "admin manages service price options"
  on public.service_price_options;

drop policy if exists "admin reads service price options"
  on public.service_price_options;

create policy "admin reads service price options"
  on public.service_price_options
  for select
  to authenticated
  using (public.is_admin());
