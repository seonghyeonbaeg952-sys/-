begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';

-- Listing metadata is an administrative operation. Public object URLs continue
-- working because the bucket remains public. This does NOT make draft uploads
-- private, revoke known public URLs or resolve the entire publication boundary.
drop policy if exists site_images_public_read on storage.objects;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='storage'
    and tablename='objects' and policyname='site_images_admin_read') then
    create policy site_images_admin_read on storage.objects for select
      to authenticated using (bucket_id='site-images' and (select public.is_admin()));
  else
    alter policy site_images_admin_read on storage.objects to authenticated
      using (bucket_id='site-images' and (select public.is_admin()));
  end if;
end $$;
commit;
