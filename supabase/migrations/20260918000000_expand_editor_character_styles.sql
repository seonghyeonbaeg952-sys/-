-- Add optional character color/emphasis to the existing schemaVersion 1 validator.
-- Existing font/size documents, 512KB document bound and 500-run limit stay valid.
-- No table, public grant, authentication, publication or RLS behavior changes.
-- UTF-16 code-point validation stays here; grapheme validation remains in the client.
begin;

create or replace function public.validate_site_editor_text_styles(p_styles jsonb)
returns void language plpgsql immutable security invoker set search_path = ''
as $$
declare
  section record;
  field record;
  entry jsonb;
  property record;
  value_text text;
  edges integer[];
  utf16_length integer;
  previous_end integer;
  run_start numeric;
  run_end numeric;
begin
  if jsonb_typeof(p_styles) is distinct from 'object' then
    raise exception using errcode='22023', message='글자 서식 형식을 확인해 주세요.';
  end if;
  for section in select * from jsonb_each(p_styles) loop
    if section.key not in ('shared','mobile','tablet','desktop') or jsonb_typeof(section.value) is distinct from 'object' then
      raise exception using errcode='22023', message='지원하지 않는 글자 서식 범위입니다.';
    end if;
    for field in select * from jsonb_each(section.value) loop
      if field.key !~ '^[A-Za-z0-9_.-]{1,120}$'
        or field.key ~ '(^[.]|[.]$|[.][.])'
        or field.key ~ '(^|[.])(__proto__|constructor|prototype)($|[.])'
        or jsonb_typeof(field.value) is distinct from 'object'
      then raise exception using errcode='22023', message='글자 서식 문구 키를 확인해 주세요.'; end if;
      if not field.value ?& array['text','runs']
        or exists(select 1 from jsonb_object_keys(field.value) k where k not in ('text','runs'))
        or jsonb_typeof(field.value->'text') is distinct from 'string'
        or jsonb_typeof(field.value->'runs') is distinct from 'array'
      then raise exception using errcode='22023', message='글자 서식 문구 형식을 확인해 주세요.'; end if;
      value_text := field.value->>'text';
      if length(value_text)>10000 or value_text ~* '<[[:space:]]*/?[[:space:]]*[[:alpha:]][^>]*>'
        or jsonb_array_length(field.value->'runs')>500
      then raise exception using errcode='22023', message='문구는 일반 텍스트 10,000자, 서식은 500개 이내로 입력해 주세요.'; end if;
      -- PostgreSQL counts code points; DOM Range/textarea offsets count UTF-16 code units.
      select array_prepend(0,array_agg(position::integer order by ordinal)) into edges
      from (
        select ordinal, sum(case when ascii(character)>65535 then 2 else 1 end) over(order by ordinal) as position
        from unnest(string_to_array(value_text,null)) with ordinality as characters(character,ordinal)
      ) positions;
      utf16_length := edges[cardinality(edges)];
      previous_end := 0;
      for entry in select value from jsonb_array_elements(field.value->'runs') loop
        if jsonb_typeof(entry) is distinct from 'object' then
          raise exception using errcode='22023', message='글자 서식 범위를 확인해 주세요.';
        end if;
        if not entry ?& array['start','end','style']
          or exists(select 1 from jsonb_object_keys(entry) k where k not in ('start','end','style'))
          or jsonb_typeof(entry->'start') is distinct from 'number'
          or jsonb_typeof(entry->'end') is distinct from 'number'
          or jsonb_typeof(entry->'style') is distinct from 'object'
          or entry->'style'='{}'::jsonb
        then raise exception using errcode='22023', message='글자 서식 범위를 확인해 주세요.'; end if;
        run_start := (entry->>'start')::numeric;
        run_end := (entry->>'end')::numeric;
        if run_start<>trunc(run_start) or run_end<>trunc(run_end) or run_start<previous_end or run_end<=run_start or run_end>utf16_length then
          raise exception using errcode='22023', message='글자 서식 범위는 겹치지 않는 문구 내 정수여야 합니다.';
        end if;
        if not run_start::integer=any(edges) or not run_end::integer=any(edges) then
          raise exception using errcode='22023', message='문자 중간에 글자 서식을 적용할 수 없습니다.';
        end if;
        previous_end := run_end::integer;
        for property in select * from jsonb_each(entry->'style') loop
          if property.key='fontFamily' then
            if jsonb_typeof(property.value)<>'string' or property.value #>> '{}' not in ('system','gothic-a1','hahmlet','arita-buri','gowun-batang','grandiflora') then
              raise exception using errcode='22023', message='지원하는 글꼴을 선택해 주세요.';
            end if;
          elsif property.key='fontSize' then
            if jsonb_typeof(property.value)<>'number' then
              raise exception using errcode='22023', message='글자 크기는 숫자로 입력해 주세요.';
            end if;
            if (property.value #>> '{}')::numeric not between 10 and 120 then
              raise exception using errcode='22023', message='글자 크기는 10–120px 범위로 입력해 주세요.';
            end if;
          elsif property.key='color' then
            if jsonb_typeof(property.value)<>'string' or property.value #>> '{}' !~ '^#[0-9A-Fa-f]{6}$' then
              raise exception using errcode='22023', message='글자 색상은 #RRGGBB 형식의 6자리 HEX 색상으로 입력해 주세요.';
            end if;
          elsif property.key='fontWeight' then
            if jsonb_typeof(property.value)<>'number' then
              raise exception using errcode='22023', message='글자 굵기는 지원하는 숫자 값으로 선택해 주세요.';
            end if;
            if (property.value #>> '{}')::numeric not in (400,500,600,700,800) then
              raise exception using errcode='22023', message='글자 굵기는 400, 500, 600, 700, 800 중에서 선택해 주세요.';
            end if;
          elsif property.key='fontStyle' then
            if jsonb_typeof(property.value)<>'string' or property.value #>> '{}' not in ('normal','italic') then
              raise exception using errcode='22023', message='글자 기울임은 기본 또는 기울임으로 선택해 주세요.';
            end if;
          elsif property.key='textDecoration' then
            if jsonb_typeof(property.value)<>'string' or property.value #>> '{}' not in ('none','underline','line-through') then
              raise exception using errcode='22023', message='글자 장식은 없음, 밑줄, 취소선 중에서 선택해 주세요.';
            end if;
          else
            raise exception using errcode='22023', message='지원하지 않는 글자 서식입니다.';
          end if;
        end loop;
      end loop;
    end loop;
  end loop;
end;
$$;
revoke all on function public.validate_site_editor_text_styles(jsonb) from public, anon, authenticated;


notify pgrst, 'reload schema';
commit;
