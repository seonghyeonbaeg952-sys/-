-- Integration proof. Every test write is inside this transaction and rolled back.
-- Do not run only selected statements or remove the final ROLLBACK.
begin;
do $$
begin
  if exists(select 1 from public.sample_english_editor_pages) then
    raise exception 'Run this initial-isolation proof only against an empty sample workspace.';
  end if;
  perform set_config('sample_test.original_digest',
    (select md5(string_agg(page_key || draft::text || coalesce(published::text,''), '|' order by page_key)) from public.site_editor_pages), true);
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
end $$;
set local role authenticated;
do $$
begin
  assert (select count(*) = 0 from public.sample_english_editor_pages), 'non-admin draft read';
  begin
    perform public.save_sample_english_editor_draft('home', '{"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{}}', 0);
    raise exception 'non-admin save was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.publish_sample_english_editor_page('home', 1);
    raise exception 'non-admin publish was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
declare admin_id uuid;
begin
  select id into admin_id from public.profiles where role = 'admin' limit 1;
  assert admin_id is not null, 'an existing authorised administrator is required';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
end $$;
set local role authenticated;
do $$
declare
  first_doc jsonb := '{"schemaVersion":1,"copy":{"home.test":"First English draft"},"deviceCopy":{},"appearance":{}}';
  second_doc jsonb := '{"schemaVersion":1,"copy":{"home.test":"Second English draft"},"deviceCopy":{},"appearance":{}}';
  result public.sample_english_editor_pages%rowtype;
  revision_id uuid;
begin
  result := public.save_sample_english_editor_draft('home', first_doc, 0);
  assert result.version = 1 and result.published is null, 'save only draft';
  assert (select count(*) = 0 from public.get_public_sample_english_editor_pages()), 'unpublished draft leaked';
  begin
    perform public.save_sample_english_editor_draft('home', second_doc, 0);
    raise exception 'stale save accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.publish_sample_english_editor_page('home', 0);
    raise exception 'invalid publication version accepted';
  exception when invalid_parameter_value then null;
  end;
  result := public.publish_sample_english_editor_page('home', 1);
  assert result.version = 2 and result.published = first_doc, 'publication mismatch';
  assert (select document = first_doc from public.get_public_sample_english_editor_pages() where page_key = 'home'), 'public projection mismatch';
  select id into revision_id from public.sample_english_editor_revisions where page_key = 'home';
  assert revision_id is not null, 'missing immutable history';
  result := public.save_sample_english_editor_draft('home', second_doc, 2);
  assert result.version = 3 and result.published = first_doc and result.draft = second_doc, 'later draft mutated publication';
  begin
    perform public.publish_sample_english_editor_page('home', 2);
    raise exception 'stale publication accepted';
  exception when serialization_failure then null;
  end;
  result := public.restore_sample_english_editor_revision(revision_id, 3);
  assert result.version = 4 and result.draft = first_doc and result.published = first_doc, 'restore is not draft-only';
  assert (select count(*) = 1 from public.sample_english_editor_revisions), 'restore published another revision';
  begin
    perform public.save_sample_english_editor_draft('home', '{"schemaVersion":1,"copy":{"x":"<script>bad</script>"},"deviceCopy":{},"appearance":{}}', 4);
    raise exception 'unsafe HTML accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;
set local role anon;
do $$
begin
  assert (select count(*) = 1 from public.get_public_sample_english_editor_pages()), 'anonymous publication read';
  begin
    perform count(*) from public.sample_english_editor_pages;
    raise exception 'anonymous private read allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_sample_english_editor_draft('home', '{"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{}}', 4);
    raise exception 'anonymous mutation allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  assert current_setting('sample_test.original_digest') =
    (select md5(string_agg(page_key || draft::text || coalesce(published::text,''), '|' order by page_key)) from public.site_editor_pages), 'original publication or draft changed';
end $$;
select 'PASS: admin / non-admin / anonymous, draft and publication isolation, stale-write rejection, restore, HTML validation and original integrity' as verification;
rollback;
