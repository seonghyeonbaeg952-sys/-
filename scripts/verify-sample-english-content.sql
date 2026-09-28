begin;

-- Fixtures are created and removed by ROLLBACK. No existing row is changed.
do $$
declare
  fixture_id uuid;
  second_id uuid;
  administrator uuid;
  result public.sample_english_content%rowtype;
  rejected boolean;
begin
  select id into administrator from public.profiles where role='admin' order by id limit 1;
  if administrator is null then raise exception 'An existing administrator is required for this verification'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub',administrator::text,true);
  perform pg_catalog.set_config('request.jwt.claims',pg_catalog.json_build_object('sub',administrator,'role','authenticated')::text,true);

  insert into public.notices(title,content,category,is_visible) values('EN verification rollback fixture','Source content','notice',true) returning id into fixture_id;
  insert into public.notices(title,content,category,is_visible) values('EN verification rollback fixture','Second source','notice',true) returning id into second_id;
  perform pg_catalog.set_config('sample_english_test.record',fixture_id::text,true);

  result := public.save_sample_english_content_draft('notices',fixture_id,'{"title":"First English notice","content":"English content"}'::jsonb,0);
  if result.version <> 1 or result.published is not null then raise exception 'Draft was published prematurely'; end if;
  if exists(select 1 from public.get_public_sample_english_content() where record_id=fixture_id) then raise exception 'Private draft leaked'; end if;
  rejected := false;
  begin perform public.save_sample_english_content_draft('notices',fixture_id,'{"title":"Stale write"}'::jsonb,0); exception when serialization_failure then rejected := true; end;
  if not rejected then raise exception 'Stale draft overwrote a newer version'; end if;
  rejected := false;
  begin perform public.save_sample_english_content_draft('notices',fixture_id,'{"is_visible":"true"}'::jsonb,1); exception when invalid_parameter_value then rejected := true; end;
  if not rejected then raise exception 'Shared source metadata was writable through English'; end if;
  rejected := false;
  begin perform public.save_sample_english_content_draft('contacts',fixture_id,'{"title":"Private data"}'::jsonb,0); exception when invalid_parameter_value then rejected := true; end;
  if not rejected then raise exception 'Private resource was accepted'; end if;

  result := public.publish_sample_english_content('notices',fixture_id,1);
  if result.version <> 2 or result.published->>'title' <> 'First English notice' then raise exception 'Publication failed'; end if;
  perform public.save_sample_english_content_draft('notices',second_id,'{"title":"Second English notice"}'::jsonb,0);
  perform public.publish_sample_english_content('notices',second_id,1);
  if (select count(*) from public.get_public_sample_english_content() where record_id in (fixture_id,second_id)) <> 2 then raise exception 'Independent record identities failed'; end if;

  result := public.save_sample_english_content_draft('notices',fixture_id,'{"title":"Unpublished change"}'::jsonb,2);
  if (select published->>'title' from public.get_public_sample_english_content() where record_id=fixture_id) <> 'First English notice' then raise exception 'Draft replaced the publication'; end if;
  rejected := false;
  begin perform public.publish_sample_english_content('notices',fixture_id,2); exception when serialization_failure then rejected := true; end;
  if not rejected then raise exception 'Stale publication was accepted'; end if;

  update public.notices set is_visible=false where id=fixture_id;
  if exists(select 1 from public.get_public_sample_english_content() where record_id=fixture_id) then raise exception 'Hidden original was exposed by English publication'; end if;
  delete from public.notices where id=second_id;
  if exists(select 1 from public.get_public_sample_english_content() where record_id=second_id) then raise exception 'Deleted original remained public in English'; end if;
end;
$$;

set local role authenticated;
do $$
declare fixture_id uuid := pg_catalog.current_setting('sample_english_test.record')::uuid;
begin
  if not exists(select 1 from public.sample_english_content where record_id=fixture_id) then raise exception 'Admin cannot read English draft'; end if;
end;
$$;
reset role;

-- A non-administrator cannot read or write drafts, even with a valid login role.
select pg_catalog.set_config('request.jwt.claim.sub','',true);
select pg_catalog.set_config('request.jwt.claims','{"role":"authenticated"}',true);
set local role authenticated;
do $$
declare rejected boolean := false;
begin
  if exists(select 1 from public.sample_english_content) then raise exception 'Non-admin can read private drafts'; end if;
  begin perform public.save_sample_english_content_draft('notices',pg_catalog.current_setting('sample_english_test.record')::uuid,'{}'::jsonb,3); exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Non-admin can save English content'; end if;
end;
$$;
reset role;

set local role anon;
do $$
declare rejected boolean := false;
begin
  begin perform 1 from public.sample_english_content; exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Anonymous role can read draft table'; end if;
  rejected := false;
  begin perform public.publish_sample_english_content('notices',pg_catalog.current_setting('sample_english_test.record')::uuid,3); exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Anonymous role can publish'; end if;
  perform 1 from public.get_public_sample_english_content();
end;
$$;
reset role;
select 'PASS: draft/publish isolation, stable IDs, stale writes, metadata allowlist, hidden/deleted source, admin/non-admin/anonymous permissions; all fixtures rolled back' as verification;
rollback;
