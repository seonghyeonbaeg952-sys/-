-- Run as the migration owner. All fixture changes are rolled back, including on failure.
begin;
set local statement_timeout = '15s';

do $$
declare
  administrator uuid;
  saved public.site_editor_pages%rowtype;
  revision_id uuid;
  document jsonb := '{"schemaVersion":1,"copy":{"common.test":"  원문\n보존  "},"deviceCopy":{"mobile":{"common.test":"모바일"}},"appearance":{"shared":{"fontSize":16},"mobile":{"textColor":"#123456"}},"textStyles":{"mobile":{"common.test":{"text":"모바일","runs":[{"start":0,"end":2,"style":{"fontFamily":"hahmlet","fontSize":28,"color":"#123ABC","fontWeight":700,"fontStyle":"italic","textDecoration":"underline"}}]}}}}'::jsonb;
  invalid_document jsonb;
begin
  -- Fail closed rather than overwriting a real editor page during a repeat run.
  if exists (select 1 from public.site_editor_pages where page_key = 'common') then
    raise exception 'Use an isolated database: the common page already contains data.';
  end if;
  select id into administrator from public.profiles where role = 'admin' order by id limit 1;
  if administrator is null then raise exception 'An existing administrator is required for this rollback-only test.'; end if;
  perform set_config('request.jwt.claim.sub', administrator::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',administrator,'role','authenticated')::text, true);

  select * into saved from public.save_site_editor_draft('common', document, 0);
  assert saved.version = 1 and saved.draft = document and saved.published is null, 'Draft save must preserve original text and not publish.';
  assert not exists (select 1 from public.get_public_site_editor_pages() where page_key = 'common'), 'Public response leaked an unpublished draft.';
  begin
    perform public.save_site_editor_draft('common', document, 0);
    raise exception 'A stale first-save version was accepted.';
  exception when serialization_failure then null;
  end;

  select * into saved from public.publish_site_editor_page('common', 1);
  assert saved.version = 2 and saved.published = document, 'Publish must atomically advance the version.';
  assert (select p.document = saved.published from public.get_public_site_editor_pages() p where page_key = 'common'), 'Published projection is incorrect.';
  select id into revision_id from public.site_editor_revisions where page_key = 'common';
  assert revision_id is not null, 'Publication history is missing.';
  select * into saved from public.save_site_editor_draft('common', jsonb_set(document, '{copy,common.test}', '"수정 초안"'), 2);
  assert saved.version = 3 and saved.published = document, 'Saving a later draft changed the published document.';
  select * into saved from public.restore_site_editor_revision(revision_id, 3);
  assert saved.version = 4 and saved.draft = document and saved.published = document, 'History restoration must only restore a draft.';
  assert (select count(*) = 1 from public.site_editor_revisions where page_key = 'common'), 'Restoring a draft must not create a publication.';

  for invalid_document in select value from jsonb_array_elements('[
    {"schemaVersion":2,"copy":{},"deviceCopy":{},"appearance":{}},
    {"schemaVersion":1,"copy":{"x":"<script>alert(1)</script>"},"deviceCopy":{},"appearance":{}},
    {"schemaVersion":1,"copy":{"__proto__.x":"bad"},"deviceCopy":{},"appearance":{}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{"watch":{}},"appearance":{}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{"mobile":{"fontSize":-1}}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{"shared":{"textColor":"url(javascript:1)"}}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{"shared":{"fontFamily":"external"}}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{"shared":{"fontWeight":650}}},
    {"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{},"unknown":true}
  ]'::jsonb)
  loop
    begin
      perform public.save_site_editor_draft('common', invalid_document, 4);
      raise exception 'Invalid editor document was accepted: %', invalid_document;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  begin
    perform public.save_site_editor_draft('common', jsonb_set(document, '{copy,common.test}', to_jsonb(repeat('a', 10001))), 4);
    raise exception 'Oversized text was accepted.';
  exception when invalid_parameter_value then null;
  end;
  assert (select version = 4 from public.site_editor_pages where page_key = 'common'), 'Rejected writes changed the version.';

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    perform public.save_site_editor_draft('common', document, 4);
    raise exception 'Non-administrator save was accepted.';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.publish_site_editor_page('common', 4);
    raise exception 'Non-administrator publication was accepted.';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.restore_site_editor_revision(revision_id, 4);
    raise exception 'Non-administrator history restoration was accepted.';
  exception when insufficient_privilege then null;
  end;

  assert not has_table_privilege('anon', 'public.site_editor_pages', 'SELECT'), 'Anonymous draft read grant exists.';
  assert not has_table_privilege('authenticated', 'public.site_editor_pages', 'INSERT,UPDATE,DELETE'), 'Direct editor writes bypass the RPC.';
  assert not has_table_privilege('anon', 'public.site_editor_revisions', 'SELECT'), 'Anonymous publication history grant exists.';
  assert not has_function_privilege('anon', 'public.save_site_editor_draft(text,jsonb,bigint)', 'EXECUTE'), 'Anonymous mutation grant exists.';
end;
$$;

set local role anon;
do $$
begin
  assert (select count(*) = 1 from public.get_public_site_editor_pages() where page_key = 'common'), 'Anonymous public snapshot read failed.';
  begin
    perform draft from public.site_editor_pages;
    raise exception 'Anonymous draft read succeeded.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role authenticated;
do $$
begin
  assert not exists (select 1 from public.site_editor_pages), 'Non-admin authenticated draft read succeeded.';
  assert not exists (select 1 from public.site_editor_revisions), 'Non-admin authenticated history read succeeded.';
  begin
    update public.site_editor_pages set version = 9 where page_key = 'common';
    raise exception 'Direct authenticated write succeeded.';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'site_editor_contract: passed; all fixtures rolled back' as result;
