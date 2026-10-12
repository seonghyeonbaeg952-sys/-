-- Align server validation with the existing CMS font choices and 300px limit.
-- Only the font allowlists and character-size limit change. Existing document
-- shape checks, UTF-16 bounds, byte/run limits, ownership, RPCs and RLS remain.
do $$
declare
  function_name text;
  definition text;
  updated_definition text;
  old_fonts text := '''system'',''gothic-a1'',''hahmlet'',''arita-buri'',''gowun-batang'',''grandiflora''';
  current_fonts text := '''system'',''gothic-a1'',''hahmlet'',''arita-buri'',''gowun-batang'',''grandiflora'',''cormorant-garamond'',''georgia''';
begin
  foreach function_name in array array['validate_site_editor_document','validate_site_editor_text_styles'] loop
    definition := pg_get_functiondef(format('public.%I(jsonb)',function_name)::regprocedure);
    if position(old_fonts in definition) = 0 and position(current_fonts in definition) = 0 then
      raise exception 'Unexpected font validator definition: %',function_name;
    end if;
    updated_definition := case when position(current_fonts in definition) > 0 then definition
      else replace(definition,old_fonts,current_fonts) end;
    if function_name = 'validate_site_editor_text_styles' then
      if position('between 10 and 120' in definition) = 0 and position('between 10 and 300' in definition) = 0 then
        raise exception 'Unexpected character-size validator definition';
      end if;
      updated_definition := replace(updated_definition,'between 10 and 120','between 10 and 300');
      updated_definition := replace(updated_definition,'10–120px','10–300px');
    end if;
    execute updated_definition;
  end loop;
end;
$$;

-- Internal validators stay internal; mutation RPC authorization is untouched.
revoke all on function public.validate_site_editor_document(jsonb) from public, anon, authenticated;
revoke all on function public.validate_site_editor_text_styles(jsonb) from public, anon, authenticated;
notify pgrst, 'reload schema';
