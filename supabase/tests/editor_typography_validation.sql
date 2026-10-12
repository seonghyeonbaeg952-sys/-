-- Read-only regression checks against the actual database validators.
-- No content, publication, role or policy is changed by this script.
do $$
declare
  font text;
  doc jsonb;
  invalid_doc jsonb;
  rejected boolean;
  failures text[] := array[]::text[];
  base jsonb := '{"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{}}'::jsonb;
begin
  foreach font in array array['system','gothic-a1','hahmlet','arita-buri','gowun-batang','grandiflora','cormorant-garamond','georgia'] loop
    doc := base || jsonb_build_object('appearance',jsonb_build_object('desktop',jsonb_build_object('fontFamily',font,'headingFontFamily',font)));
    begin
      perform public.validate_site_editor_document(doc);
    exception when sqlstate '22023' then
      failures := array_append(failures,'appearance font rejected: ' || font);
    end;
    doc := base || jsonb_build_object('textStyles',jsonb_build_object('desktop',jsonb_build_object('spirit.test',
      jsonb_build_object('text','합창','runs',jsonb_build_array(jsonb_build_object('start',0,'end',2,'style',jsonb_build_object('fontFamily',font,'fontSize',70)))))));
    begin
      perform public.validate_site_editor_document(doc);
    exception when sqlstate '22023' then
      failures := array_append(failures,'character font rejected: ' || font);
    end;
  end loop;

  doc := base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":2,"style":{"fontSize":300}}]}}}}'::jsonb;
  begin
    perform public.validate_site_editor_document(doc);
  exception when sqlstate '22023' then
    failures := array_append(failures,'supported 300px character size rejected');
  end;

  for invalid_doc in select value from jsonb_array_elements(jsonb_build_array(
    base || '{"appearance":{"desktop":{"fontFamily":"untrusted-font"}}}'::jsonb,
    base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":2,"style":{"fontFamily":"untrusted-font"}}]}}}}'::jsonb,
    base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":2,"style":{"fontSize":301}}]}}}}'::jsonb,
    base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":2,"style":{"fontSize":9}}]}}}}'::jsonb,
    base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":3,"style":{"fontSize":70}}]}}}}'::jsonb,
    base || '{"textStyles":{"desktop":{"spirit.test":{"text":"합창","runs":[{"start":0,"end":2,"style":{"unknown":true}}]}}}}'::jsonb,
    base || '{"copy":{"spirit.test":"<script>alert(1)</script>"}}'::jsonb,
    base || '{"textLayouts":{"desktop":{"spirit.test":{"offsetX":2001}}}}'::jsonb
  )) loop
    rejected := false;
    begin
      perform public.validate_site_editor_document(invalid_doc);
    exception when sqlstate '22023' then
      rejected := true;
    end;
    if not rejected then failures := array_append(failures,'invalid document accepted: ' || invalid_doc::text); end if;
  end loop;

  if has_function_privilege('anon','public.validate_site_editor_document(jsonb)','execute')
    or has_function_privilege('authenticated','public.validate_site_editor_document(jsonb)','execute')
    or has_function_privilege('anon','public.validate_site_editor_text_styles(jsonb)','execute')
    or has_function_privilege('authenticated','public.validate_site_editor_text_styles(jsonb)','execute') then
    failures := array_append(failures,'internal validation functions unexpectedly exposed');
  end if;
  if cardinality(failures) > 0 then raise exception 'Editor typography regression failures: %', array_to_string(failures,'; '); end if;
end;
$$;
select 'editor typography validation passed' as result;
