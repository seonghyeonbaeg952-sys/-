-- Rollback-only validation contract; no production data is touched.
begin;
set local statement_timeout = '15s';
do $$
declare
  base jsonb := '{"schemaVersion":1,"copy":{},"deviceCopy":{},"appearance":{}}';
  styles jsonb;
begin
  perform public.validate_site_editor_document(base);
  perform public.validate_site_editor_document(base || '{"textStyles":{"shared":{"title":{"text":"A😀B","runs":[{"start":1,"end":3,"style":{"fontFamily":"hahmlet","fontSize":32}}]}},"mobile":{"title":{"text":"A😀B","runs":[]}}}}');
  perform public.validate_site_editor_document(base || '{"textStyles":{}}');
  for styles in select value from jsonb_array_elements('[
    {"color":"#A0b1C2"}, {"color":"#000000"}, {"color":"#FFFFFF"},
    {"fontWeight":400}, {"fontWeight":500}, {"fontWeight":600}, {"fontWeight":700}, {"fontWeight":800},
    {"fontStyle":"normal"}, {"fontStyle":"italic"},
    {"textDecoration":"none"}, {"textDecoration":"underline"}, {"textDecoration":"line-through"},
    {"fontFamily":"hahmlet","fontSize":32,"color":"#10233F","fontWeight":700,"fontStyle":"italic","textDecoration":"underline"}
  ]'::jsonb) loop
    perform public.validate_site_editor_document(base || jsonb_build_object('textStyles', jsonb_build_object('shared', jsonb_build_object('title', jsonb_build_object('text','제목','runs',jsonb_build_array(jsonb_build_object('start',0,'end',2,'style',styles)))))));
  end loop;
  for styles in select value from jsonb_array_elements('[
    {"color":"red"}, {"color":"#abc"}, {"color":"#12345678"}, {"color":"#12345G"},
    {"color":"#123456;display:none"}, {"color":"var(--secret)"}, {"color":"url(javascript:1)"},
    {"color":" #123456"}, {"color":"#123456 "}, {"color":null}, {"color":123456},
    {"fontWeight":300}, {"fontWeight":900}, {"fontWeight":450}, {"fontWeight":"700"}, {"fontWeight":null},
    {"fontStyle":"oblique"}, {"fontStyle":"initial"}, {"fontStyle":""}, {"fontStyle":null},
    {"textDecoration":"underline line-through"}, {"textDecoration":"overline"}, {"textDecoration":"inherit"}, {"textDecoration":""}, {"textDecoration":null},
    {"backgroundColor":"#123456"}, {"color":"#123456","fontWeight":700,"css":"display:none"}
  ]'::jsonb) loop
    begin
      perform public.validate_site_editor_document(base || jsonb_build_object('textStyles', jsonb_build_object('shared', jsonb_build_object('title', jsonb_build_object('text','제목','runs',jsonb_build_array(jsonb_build_object('start',0,'end',2,'style',styles)))))));
      raise exception 'Unapproved character style value was accepted: %', styles;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  assert not has_function_privilege('anon','public.validate_site_editor_text_styles(jsonb)','EXECUTE'), 'Validation helper must not become a public RPC';
  assert not has_function_privilege('authenticated','public.validate_site_editor_text_styles(jsonb)','EXECUTE'), 'Authentication alone must not expose validation helper';
  for styles in select value from jsonb_array_elements('[
    null, [], {"watch":{}}, {"shared":{"__proto__":{"text":"x","runs":[]}}},
    {"shared":{"title":{"text":"<b>text</b>","runs":[]}}},
    {"shared":{"title":{"text":"abc","runs":[],"html":"x"}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{"fontSize":9}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{"fontSize":121}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{"fontFamily":"external"}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{"color":"red"}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":1,"style":{"fontSize":24},"html":"x"}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":2,"style":{"fontSize":24}},{"start":1,"end":3,"style":{"fontSize":30}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":2,"end":3,"style":{"fontSize":24}},{"start":0,"end":1,"style":{"fontSize":30}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0,"end":4,"style":{"fontSize":24}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":1,"end":1,"style":{"fontSize":24}}]}}},
    {"shared":{"title":{"text":"abc","runs":[{"start":0.5,"end":1,"style":{"fontSize":24}}]}}},
    {"shared":{"title":{"text":"A😀B","runs":[{"start":1,"end":2,"style":{"fontSize":24}}]}}}
  ]'::jsonb) loop
    begin
      perform public.validate_site_editor_document(base || jsonb_build_object('textStyles',styles));
      raise exception 'Invalid character formatting was accepted: %', styles;
    exception when invalid_parameter_value then null;
    end;
  end loop;
  begin
    perform public.validate_site_editor_document(base || jsonb_build_object('textStyles', jsonb_build_object('shared', jsonb_build_object('title', jsonb_build_object('text',repeat('한',10001),'runs','[]'::jsonb)))));
    raise exception 'Oversized text snapshot was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    select jsonb_agg(jsonb_build_object('start',n,'end',n+1,'style',jsonb_build_object('fontSize',24))) into styles from generate_series(0,500) n;
    perform public.validate_site_editor_document(base || jsonb_build_object('textStyles', jsonb_build_object('shared', jsonb_build_object('title',jsonb_build_object('text',repeat('a',501),'runs',styles)))));
    raise exception 'More than 500 style ranges were accepted';
  exception when invalid_parameter_value then null;
  end;
end;
$$;
rollback;
