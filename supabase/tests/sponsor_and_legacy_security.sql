begin;
set local statement_timeout = '15s';
do $$
begin
  assert not has_column_privilege('anon','public.sponsors','internal_notes','SELECT'), 'Sponsor internal notes are publicly readable.';
  assert not has_column_privilege('anon','public.sponsors','name','SELECT'), 'Original sponsor names are publicly readable outside the public projection.';
  assert not exists(select 1 from pg_policies where schemaname='public' and tablename='sponsors' and policyname='sponsors_public_read_visible'), 'A non-admin authenticated user still has the public full-row policy.';
  assert not has_table_privilege('anon','public.join_applications','INSERT'), 'Retired legacy admission inserts are still permitted.';
  assert not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='join_application_files_public_insert'), 'Retired unbound anonymous uploads are still permitted.';
  assert exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='join_application_files_admin_select'), 'Historical administrator attachment access was removed.';
  assert has_function_privilege('anon','public.submit_join_application_v2(uuid,uuid,text,date,text,text,text,text[],text,boolean)','EXECUTE'), 'Current admissions RPC was disabled.';
end;
$$;
insert into public.sponsors(id,name,display_name,category,tier,is_visible,consent_public,internal_notes)
values ('0c0de000-0000-4000-8000-000000000001','TEST PRIVATE NAME','TEST DISPLAY NAME','other','supporter',true,true,'PRIVATE TEST NOTE'),
       ('0c0de000-0000-4000-8000-000000000002','TEST HIDDEN','TEST HIDDEN','other','supporter',false,true,'PRIVATE TEST NOTE');
set local role anon;
do $$
declare projected jsonb;
begin
  select to_jsonb(s) into projected from public.get_public_sponsors() s where id='0c0de000-0000-4000-8000-000000000001';
  assert projected->>'name'='TEST DISPLAY NAME', 'Public alias is not preserved.';
  assert not projected ? 'internal_notes', 'Public sponsor projection includes private notes.';
  assert not exists(select 1 from public.get_public_sponsors() where id='0c0de000-0000-4000-8000-000000000002'), 'Hidden sponsor was returned.';
  begin
    perform internal_notes from public.sponsors;
    raise exception 'Anonymous private column read succeeded.';
  exception when insufficient_privilege then null;
  end;
  begin
    perform name from public.sponsors;
    raise exception 'Anonymous original name read succeeded.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claims','{"role":"authenticated"}',true);
set local role authenticated;
do $$
begin
  assert not exists(select 1 from public.sponsors), 'Non-admin authenticated sponsor read leaked rows.';
end;
$$;
reset role;
rollback;
select 'sponsor_and_legacy_security: passed; fixtures rolled back' as result;
