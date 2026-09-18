-- Optional device-only block layout. No tables, rows, public grants, RLS,
-- authentication or version-CAS mutation behavior is changed.
-- Deploy this validator before enabling clients that write textLayouts.
begin;

create or replace function public.validate_site_editor_text_layouts(p_layouts jsonb)
returns void language plpgsql immutable security invoker set search_path = ''
as $$
declare
  section record;
  field record;
  property record;
  value_text text;
  value_number numeric;
begin
  if jsonb_typeof(p_layouts) is distinct from 'object' then
    raise exception using errcode='22023', message='문구 상자 배치 형식을 확인해 주세요.';
  end if;
  for section in select * from jsonb_each(p_layouts) loop
    if section.key not in ('mobile','tablet','desktop')
      or jsonb_typeof(section.value) is distinct from 'object' then
      raise exception using errcode='22023', message='문구 상자는 기기별로 배치해 주세요.';
    end if;
    if (select count(*) from jsonb_object_keys(section.value)) > 500 then
      raise exception using errcode='22023', message='기기별 문구 상자는 500개 이내로 설정해 주세요.';
    end if;
    for field in select * from jsonb_each(section.value) loop
      if field.key !~ '^[A-Za-z0-9_.-]{1,120}$'
        or field.key ~ '(^[.]|[.]$|[.][.])'
        or field.key ~ '(^|[.])(__proto__|constructor|prototype)($|[.])'
        or jsonb_typeof(field.value) is distinct from 'object' then
        raise exception using errcode='22023', message='문구 상자 식별자와 배치 형식을 확인해 주세요.';
      end if;
      for property in select * from jsonb_each(field.value) loop
        value_text := property.value #>> '{}';
        if property.key = 'textAlign' then
          if jsonb_typeof(property.value) is distinct from 'string'
            or value_text not in ('start','center','end') then
            raise exception using errcode='22023', message='지원하는 문구 정렬을 선택해 주세요.';
          end if;
        elsif property.key in ('offsetX','offsetY','width') then
          if jsonb_typeof(property.value) is distinct from 'number' then
            raise exception using errcode='22023', message='문구 상자의 위치와 너비는 숫자로 입력해 주세요.';
          end if;
          value_number := value_text::numeric;
          if (property.key in ('offsetX','offsetY') and value_number not between -2000 and 2000)
            or (property.key = 'width' and value_number not between 10 and 100) then
            raise exception using errcode='22023', message='문구 상자의 위치 또는 너비가 허용 범위를 벗어났습니다.';
          end if;
        else
          raise exception using errcode='22023', message='지원하지 않는 문구 상자 속성입니다.';
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;
revoke all on function public.validate_site_editor_text_layouts(jsonb) from public, anon, authenticated;

create or replace function public.validate_site_editor_document(p_document jsonb)
returns void language plpgsql immutable security invoker set search_path = ''
as $$
declare
  section record;
  field record;
  value_text text;
  value_number numeric;
begin
  if jsonb_typeof(p_document) is distinct from 'object'
    or octet_length(p_document::text) > 524288
    or p_document->'schemaVersion' is distinct from '1'::jsonb
    or jsonb_typeof(p_document->'copy') is distinct from 'object'
    or jsonb_typeof(p_document->'deviceCopy') is distinct from 'object'
    or jsonb_typeof(p_document->'appearance') is distinct from 'object'
  then raise exception using errcode='22023', message='편집 문서 형식 또는 크기를 확인해 주세요.'; end if;
  if exists (select 1 from jsonb_object_keys(p_document) k where k not in ('schemaVersion','copy','deviceCopy','appearance','textStyles','textLayouts'))
    or exists (select 1 from jsonb_each(p_document->'deviceCopy') d where d.key not in ('mobile','tablet','desktop') or jsonb_typeof(d.value) <> 'object')
    or exists (select 1 from jsonb_each(p_document->'appearance') a where a.key not in ('shared','mobile','tablet','desktop') or jsonb_typeof(a.value) <> 'object')
  then raise exception using errcode='22023', message='지원하지 않는 편집 항목입니다.'; end if;

  for section in
    select p_document->'copy' as value
    union all select d.value from jsonb_each(p_document->'deviceCopy') d
  loop
    for field in select * from jsonb_each(section.value) loop
      value_text := field.value #>> '{}';
      if field.key !~ '^[A-Za-z0-9_.-]{1,120}$'
        or field.key ~ '(^[.]|[.]$|[.][.])'
        or field.key ~ '(^|[.])(__proto__|constructor|prototype)($|[.])'
        or jsonb_typeof(field.value) <> 'string'
        or length(value_text) > 10000
        or value_text ~* '<[[:space:]]*/?[[:space:]]*[[:alpha:]][^>]*>'
      then raise exception using errcode='22023', message='문구 형식과 길이를 확인해 주세요. HTML은 사용할 수 없습니다.'; end if;
    end loop;
  end loop;

  for section in select * from jsonb_each(p_document->'appearance') loop
    for field in select * from jsonb_each(section.value) loop
      value_text := field.value #>> '{}';
      if field.key in ('fontFamily','headingFontFamily') then
        if jsonb_typeof(field.value) <> 'string' or value_text not in ('system','gothic-a1','hahmlet','arita-buri','gowun-batang','grandiflora')
        then raise exception using errcode='22023', message='지원하는 글꼴을 선택해 주세요.'; end if;
      elsif field.key in ('textColor','headingColor','mutedColor','accentColor','backgroundColor') then
        if jsonb_typeof(field.value) <> 'string' or value_text !~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
        then raise exception using errcode='22023', message='색상은 HEX 형식으로 입력해 주세요.'; end if;
      elsif field.key in ('fontSize','h1Size','h2Size','h3Size','labelSize','fontWeight','lineHeight','letterSpacing') then
        if jsonb_typeof(field.value) <> 'number'
        then raise exception using errcode='22023', message='디자인 수치를 확인해 주세요.'; end if;
        value_number := value_text::numeric;
        if (field.key='fontSize' and value_number not between 12 and 32)
          or (field.key='h1Size' and value_number not between 20 and 120)
          or (field.key='h2Size' and value_number not between 16 and 80)
          or (field.key='h3Size' and value_number not between 14 and 64)
          or (field.key='labelSize' and value_number not between 10 and 24)
          or (field.key='fontWeight' and value_number not in (300,400,500,600,700,800,900))
          or (field.key='lineHeight' and value_number not between 1.1 and 2.4)
          or (field.key='letterSpacing' and value_number not between -0.04 and 0.2)
        then raise exception using errcode='22023', message='디자인 수치가 허용 범위를 벗어났습니다.'; end if;
      else
        raise exception using errcode='22023', message='지원하지 않는 디자인 속성입니다.';
      end if;
    end loop;
  end loop;
  if p_document ? 'textLayouts' then
    perform public.validate_site_editor_text_layouts(p_document->'textLayouts');
  end if;
  if p_document ? 'textStyles' then
    perform public.validate_site_editor_text_styles(p_document->'textStyles');
  end if;
end;
$$;
revoke all on function public.validate_site_editor_document(jsonb) from public, anon, authenticated;


notify pgrst, 'reload schema';
commit;
