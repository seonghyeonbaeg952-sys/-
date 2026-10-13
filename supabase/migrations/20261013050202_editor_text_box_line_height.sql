-- Optional, unitless line spacing for an individual text box. Existing documents
-- and the admin-only save/publish permissions remain unchanged.
create or replace function public.validate_site_editor_text_layouts(p_layouts jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $function$
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
        elsif property.key in ('offsetX','offsetY','width','lineHeight') then
          if jsonb_typeof(property.value) is distinct from 'number' then
            raise exception using errcode='22023', message='문구 상자의 위치, 너비와 줄간격은 숫자로 입력해 주세요.';
          end if;
          value_number := value_text::numeric;
          if (property.key in ('offsetX','offsetY') and value_number not between -2000 and 2000)
            or (property.key = 'width' and value_number not between 10 and 400)
            or (property.key = 'lineHeight' and value_number not between 0.8 and 3) then
            raise exception using errcode='22023', message='문구 상자의 위치, 너비 또는 줄간격이 허용 범위를 벗어났습니다.';
          end if;
        else
          raise exception using errcode='22023', message='지원하지 않는 문구 상자 속성입니다.';
        end if;
      end loop;
    end loop;
  end loop;
end;
$function$;

-- This is an internal validator, not a new public RPC endpoint.
revoke execute on function public.validate_site_editor_text_layouts(jsonb) from public, anon, authenticated;
