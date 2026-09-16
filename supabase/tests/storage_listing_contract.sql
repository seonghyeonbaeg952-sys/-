-- Role simulation only, no file/row mutation. Admin ID stays within this DB
-- transaction and is never included in returned results.
begin;
set local statement_timeout = '10s';
do $$ begin
  perform set_config('cms.qa.image_count',(select count(*)::text from storage.objects where bucket_id='site-images'),true);
  perform set_config('cms.qa.admin_id',(select id::text from public.profiles where role='admin' limit 1),true);
  assert nullif(current_setting('cms.qa.admin_id',true),'') is not null, 'An existing administrator is required to test compatibility';
  assert (select public from storage.buckets where id='site-images'), 'Existing public image URLs must be preserved in this listing-only change';
end $$;
set local role anon;
do $$ begin
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  assert not exists(select 1 from storage.objects where bucket_id='site-images'), 'Anonymous object metadata is visible';
  assert not exists(select 1 from storage.objects where bucket_id='join-application-files'), 'Private legacy attachment metadata is visible';
end $$;
reset role;
set local role authenticated;
do $$ begin
  perform set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
  perform set_config('request.jwt.claims','{"role":"authenticated","sub":"33333333-3333-4333-8333-333333333333"}',true);
  assert not exists(select 1 from storage.objects where bucket_id='site-images'), 'A non-admin can list object metadata';
  perform set_config('request.jwt.claim.sub',current_setting('cms.qa.admin_id'),true);
  perform set_config('request.jwt.claims',json_build_object('role','authenticated','sub',current_setting('cms.qa.admin_id'))::text,true);
  assert (select count(*) from storage.objects where bucket_id='site-images')=current_setting('cms.qa.image_count')::bigint, 'Admin image access regressed';
end $$;
rollback;
select 'PASS: anonymous/non-admin listing denied, admin access retained; no file changes' as result;
