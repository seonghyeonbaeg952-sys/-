-- Validator-only, rollback-only contract. No content rows or grants are changed.
begin;
set local statement_timeout = '15s';
do $$
declare
  base jsonb := '{"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{}}';
  layouts jsonb;
  scope text;
begin
  perform public.validate_site_editor_document(base);
  perform public.validate_site_editor_document(base || '{"textLayouts":{}}');
  foreach scope in array array['mobile','tablet','desktop'] loop
    for layouts in select value from jsonb_array_elements('[
      {}, {"offsetX":-2000,"offsetY":2000,"width":10,"textAlign":"start"},
      {"offsetX":2000,"offsetY":-2000,"width":100,"textAlign":"end"},
      {"offsetX":0,"offsetY":0,"width":50.5,"textAlign":"center"},
      {"offsetX":0.25,"offsetY":-0.25}
    ]'::jsonb) loop
      perform public.validate_site_editor_document(base || jsonb_build_object('textLayouts',jsonb_build_object(scope,jsonb_build_object('home.hero.title',layouts))));
    end loop;
  end loop;
  for layouts in select value from jsonb_array_elements('[
    null, [], {"shared":{}}, {"watch":{}}, {"desktop":null}, {"mobile":[]},
    {"desktop":{"__proto__":{}}}, {"desktop":{"box.constructor.value":{}}},
    {"desktop":{".box":{}}}, {"desktop":{"a..b":{}}},
    {"desktop":{"box":null}}, {"desktop":{"box":[]}}, {"desktop":{"box":"center"}},
    {"desktop":{"box":{"height":10}}}, {"desktop":{"box":{"position":"fixed"}}},
    {"desktop":{"box":{"offsetX":"10"}}}, {"desktop":{"box":{"offsetX":null}}},
    {"desktop":{"box":{"offsetX":-2000.01}}}, {"desktop":{"box":{"offsetY":2000.01}}},
    {"desktop":{"box":{"width":9.99}}}, {"desktop":{"box":{"width":100.01}}},
    {"desktop":{"box":{"textAlign":"left"}}}, {"desktop":{"box":{"textAlign":"justify"}}},
    {"desktop":{"box":{"textAlign":"center;display:none"}}},
    {"desktop":{"box":{"width":50,"css":"display:none"}}}
  ]'::jsonb) loop
    begin
      perform public.validate_site_editor_document(base || jsonb_build_object('textLayouts',layouts));
      raise exception 'Invalid text layout was accepted: %', layouts;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  begin
    perform public.validate_site_editor_document(base || jsonb_build_object('textLayouts',jsonb_build_object('desktop',jsonb_build_object(repeat('a',121),'{}'::jsonb))));
    raise exception 'Oversized layout identity was accepted';
  exception when invalid_parameter_value then null;
  end;
  select jsonb_object_agg('box.' || n,jsonb_build_object('width',50)) into layouts from generate_series(0,499) n;
  perform public.validate_site_editor_document(base || jsonb_build_object('textLayouts',jsonb_build_object('mobile',layouts)));
  begin
    perform public.validate_site_editor_document(base || jsonb_build_object('textLayouts',jsonb_build_object('mobile',layouts || '{"box.500":{"width":50}}')));
    raise exception 'More than 500 layout entries per device were accepted';
  exception when invalid_parameter_value then null;
  end;
  -- Existing copy/style rules must remain active when layout is present.
  begin
    perform public.validate_site_editor_document((base || '{"textLayouts":{"desktop":{"box":{"width":50}}}}') || '{"copy":{"title":"<b>unsafe</b>"}}');
    raise exception 'Layout bypassed the existing text validator';
  exception when invalid_parameter_value then null;
  end;
  assert not has_function_privilege('anon','public.validate_site_editor_text_layouts(jsonb)','EXECUTE'), 'Layout helper must not become a public RPC';
  assert not has_function_privilege('authenticated','public.validate_site_editor_text_layouts(jsonb)','EXECUTE'), 'Authentication must not expose the layout helper';
  assert not has_table_privilege('anon','public.site_editor_pages','SELECT'), 'Draft table must remain private';
  assert not has_table_privilege('authenticated','public.site_editor_pages','UPDATE'), 'Writes must continue to use administrator CAS RPCs';
end;
$$;
rollback;
