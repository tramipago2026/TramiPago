-- Admin browser least privilege.
-- Public workflows write through Edge Functions using server-side service role.

revoke insert on table public.requests from authenticated;

revoke insert, update on table public.request_data from authenticated;
revoke insert, update on table public.request_files from authenticated;

revoke insert, update, delete, truncate, references, trigger
  on table public.services from authenticated;
grant select on table public.services to authenticated;

drop policy if exists "admin inserts requests" on public.requests;
drop policy if exists "admin inserts request data" on public.request_data;
drop policy if exists "admin updates request data" on public.request_data;
drop policy if exists "admin inserts request files" on public.request_files;
drop policy if exists "admin updates request files" on public.request_files;

drop policy if exists "admin manages services" on public.services;
drop policy if exists "admin reads services" on public.services;

create policy "admin reads services"
  on public.services
  for select
  to authenticated
  using (public.is_admin());
