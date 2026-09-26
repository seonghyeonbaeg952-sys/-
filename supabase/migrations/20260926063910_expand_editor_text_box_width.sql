-- Allow widening text boxes beyond their original column. Existing percent values,
-- strict property allowlists, limits, invoker security and permissions are preserved.
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
            or (property.key = 'width' and value_number not between 10 and 400) then
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


notify pgrst, 'reload schema';
commit;
