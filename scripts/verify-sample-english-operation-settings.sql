begin;

-- Existing source records are read only. Every English fixture rolls back.
do $$
declare
  administrator uuid;
  source_id uuid;
  item record;
  saved public.sample_english_content%rowtype;
  rejected boolean;
begin
  select id into administrator from public.profiles where role='admin' order by id limit 1;
  if administrator is null then raise exception 'Verification needs an existing administrator'; end if;
  perform pg_catalog.set_config('request.jwt.claim.sub',administrator::text,true);
  perform pg_catalog.set_config('request.jwt.claims',pg_catalog.json_build_object('sub',administrator,'role','authenticated')::text,true);

  for item in select * from (values
    ('site_settings','site_title','English site title'),
    ('locations','place_name','English location'),
    ('join_info','title','Join us'),
    ('support_settings','title','Support pledge')
  ) as allowed(resource,field,value) loop
    execute pg_catalog.format('select id from public.%I where is_visible is true limit 1',item.resource) into source_id;
    if source_id is null then raise exception 'Visible source missing for %',item.resource; end if;
    saved := public.save_sample_english_content_draft(item.resource,source_id,pg_catalog.jsonb_build_object(item.field,item.value),0);
    if saved.version <> 1 or saved.published is not null then raise exception 'Draft leaked for %',item.resource; end if;
    if exists(select 1 from public.get_public_sample_english_content() where resource=item.resource and record_id=source_id) then raise exception 'Draft public for %',item.resource; end if;
    saved := public.publish_sample_english_content(item.resource,source_id,1);
    if saved.version <> 2 or saved.published->>item.field <> item.value then raise exception 'Publication failed for %',item.resource; end if;
    if not exists(select 1 from public.get_public_sample_english_content() where resource=item.resource and record_id=source_id) then raise exception 'Published source missing for %',item.resource; end if;
    rejected := false;
    begin perform public.save_sample_english_content_draft(item.resource,source_id,'{"is_visible":"true"}'::jsonb,2); exception when invalid_parameter_value then rejected := true; end;
    if not rejected then raise exception 'Metadata writable for %',item.resource; end if;
  end loop;
  rejected := false;
  begin perform public.save_sample_english_content_draft('support_settings',source_id,'{"bank_account_number":"changed"}'::jsonb,2); exception when invalid_parameter_value then rejected := true; end;
  if not rejected then raise exception 'Account details writable through translation'; end if;
end;
$$;

set local role anon;
do $$
declare rejected boolean := false;
begin
  begin perform 1 from public.sample_english_content; exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Anonymous draft access'; end if;
  if (select count(*) from public.get_public_sample_english_content() where resource in ('site_settings','locations','join_info','support_settings')) <> 4 then raise exception 'Published projection incomplete'; end if;
end;
$$;
reset role;

select pg_catalog.set_config('request.jwt.claim.sub','',true);
select pg_catalog.set_config('request.jwt.claims','{"role":"authenticated"}',true);
set local role authenticated;
do $$
declare rejected boolean := false;
begin
  if exists(select 1 from public.sample_english_content where resource in ('site_settings','locations','join_info','support_settings')) then raise exception 'Non-admin draft access'; end if;
  begin perform public.save_sample_english_content_draft('site_settings',(select id from public.site_settings limit 1),'{}'::jsonb,2); exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Non-admin save permitted'; end if;
end;
$$;
reset role;
select 'PASS: four setting resources, independent draft/publication, public projection, metadata allowlist, administrator-only writes; fixtures rolled back' as verification;
rollback;
