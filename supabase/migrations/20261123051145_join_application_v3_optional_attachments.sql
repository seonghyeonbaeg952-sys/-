begin;
set local lock_timeout = '4s';

alter table public.join_applications
  add column school_level text,
  add column department text,
  drop constraint join_applications_form_version_check,
  drop constraint join_applications_versioned_required_check,
  add constraint join_applications_form_version_check check (form_version in (1, 2, 3)),
  add constraint join_applications_versioned_required_check check (
    coalesce(length(btrim(applicant_name)), 0) > 0
    and coalesce(length(btrim(applicant_phone)), 0) > 0
    and (
      (form_version = 1 and coalesce(length(btrim(email)), 0) > 0)
      or (form_version in (2, 3) and birth_date is not null and submission_id is not null and join_info_id is not null
        and coalesce(length(btrim(guardian_phone)), 0) > 0
        and coalesce(length(btrim(school)), 0) > 0
        and coalesce(length(btrim(motivation)), 0) > 0
        and privacy_agreed = true
        and desired_parts is not null and cardinality(desired_parts) between 1 and 4
        and array_position(desired_parts, null) is null
        and desired_parts <@ array['soprano','alto','tenor','bass']::text[])
    )
  ) not valid,
  add constraint join_applications_v3_fields_check check (
    form_version <> 3 or (
      school_level is not null and school_level in ('elementary', 'middle', 'high', 'university', 'other')
      and gender is not null and gender in ('female', 'male', 'not_specified')
      and coalesce(length(btrim(grade)), 0) between 1 and 24
      and (department is null or (school_level = 'university' and length(btrim(department)) between 1 and 120))
      and (photo_file_path is null or photo_file_path = 'join-intake-v3:photo')
      and (recommendation_file_path is null or recommendation_file_path = 'join-intake-v3:recommendation')
    )
  ) not valid;

comment on column public.join_applications.form_version is
  '1: original full form. 2: short form. 3: separate school fields, gender and private optional attachments.';

-- Modest, bounded attachments share the application's atomic transaction.
-- The private schema stores the bytes out of the administrator's list queries.
-- Historical attachments continue to use the existing private Storage bucket.
create table cms_intake_private.join_application_attachments (
  application_id uuid not null references public.join_applications(id) on delete cascade,
  kind text not null,
  media_type text not null,
  contents bytea not null,
  primary key (application_id, kind),
  check (
    (kind = 'photo' and media_type in ('image/jpeg', 'image/png') and octet_length(contents) between 1 and 2097152)
    or (kind = 'recommendation' and media_type = 'application/pdf' and octet_length(contents) between 1 and 3145728)
  )
);
alter table cms_intake_private.join_application_attachments enable row level security;
alter table cms_intake_private.join_application_attachments force row level security;
revoke all on cms_intake_private.join_application_attachments from public, anon, authenticated;

create function cms_intake_private.join_photo_portrait_ok(contents bytea, media_type text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  size_bytes integer := octet_length(contents);
  offset_bytes integer := 2;
  segment_count integer := 0;
  segment_size integer;
  marker integer;
  width_px bigint := 0;
  height_px bigint := 0;
begin
  if media_type = 'image/png' and size_bytes >= 45
    and substring(contents from 1 for 16) = decode('89504e470d0a1a0a0000000d49484452', 'hex')
    and substring(contents from size_bytes - 11 for 8) = decode('0000000049454e44', 'hex') then
    width_px := get_byte(contents, 16)::bigint * 16777216 + get_byte(contents, 17) * 65536 + get_byte(contents, 18) * 256 + get_byte(contents, 19);
    height_px := get_byte(contents, 20)::bigint * 16777216 + get_byte(contents, 21) * 65536 + get_byte(contents, 22) * 256 + get_byte(contents, 23);
  elsif media_type = 'image/jpeg' and size_bytes >= 24
    and substring(contents from 1 for 2) = decode('ffd8', 'hex')
    and substring(contents from size_bytes - 1 for 2) = decode('ffd9', 'hex') then
    -- JPEG frame dimensions are in SOF segments before compressed scan data.
    while offset_bytes + 5 <= size_bytes and segment_count < 8192 loop
      segment_count := segment_count + 1;
      if get_byte(contents, offset_bytes) <> 255 then return false; end if;
      offset_bytes := offset_bytes + 1;
      while offset_bytes < size_bytes and get_byte(contents, offset_bytes) = 255 loop
        offset_bytes := offset_bytes + 1;
      end loop;
      if offset_bytes + 3 > size_bytes then return false; end if;
      marker := get_byte(contents, offset_bytes);
      if marker in (0, 216, 217, 218) then return false; end if;
      segment_size := get_byte(contents, offset_bytes + 1) * 256 + get_byte(contents, offset_bytes + 2);
      if segment_size < 2 or offset_bytes + 1 + segment_size > size_bytes then return false; end if;
      if marker in (192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207) then
        if segment_size < 8 then return false; end if;
        height_px := get_byte(contents, offset_bytes + 4) * 256 + get_byte(contents, offset_bytes + 5);
        width_px := get_byte(contents, offset_bytes + 6) * 256 + get_byte(contents, offset_bytes + 7);
        exit;
      end if;
      offset_bytes := offset_bytes + 1 + segment_size;
    end loop;
  end if;
  if width_px not between 1 and 6000 or height_px not between 1 and 6000 then return false; end if;
  return width_px * height_px <= 16000000
    and abs(width_px * 100 - height_px * 75) <= height_px * 2;
end $$;

create function cms_intake_private.validate_join_attachment(p_file jsonb, p_kind text)
returns bytea language plpgsql immutable set search_path = '' as $$
declare
  byte_limit integer := case when p_kind = 'photo' then 2097152 else 3145728 end;
  error_message text := case when p_kind = 'photo'
    then '사진은 3:4 비율의 2MB 이하 JPG 또는 PNG 파일을 선택해 주세요.'
    else '추천서는 3MB 이하의 PDF 파일을 선택해 주세요.' end;
  media_type text := p_file ->> 'media_type';
  encoded text := p_file ->> 'base64';
  contents bytea;
  tail text;
begin
  if p_file is null or p_file = 'null'::jsonb then return null; end if;
  if jsonb_typeof(p_file) is distinct from 'object' then
    raise exception using errcode = '22023', message = error_message;
  end if;
  if (p_file - 'media_type' - 'base64') <> '{}'::jsonb
    or jsonb_typeof(p_file -> 'base64') is distinct from 'string'
    or jsonb_typeof(p_file -> 'media_type') is distinct from 'string'
    or octet_length(encoded) not between 1 and ((byte_limit + 2) / 3) * 4 then
    raise exception using errcode = '22023', message = error_message;
  end if;
  begin
    contents := decode(encoded, 'base64');
  exception when data_exception then
    raise exception using errcode = '22023', message = error_message;
  end;
  if octet_length(contents) not between 1 and byte_limit then
    raise exception using errcode = '22023', message = error_message;
  end if;
  if p_kind = 'photo' then
    if not cms_intake_private.join_photo_portrait_ok(contents, media_type) then
      raise exception using errcode = '22023', message = error_message;
    end if;
  else
    tail := encode(substring(contents from greatest(octet_length(contents) - 1023, 1)), 'escape');
    if media_type <> 'application/pdf' or substring(contents from 1 for 5) <> decode('255044462d', 'hex')
      or tail !~ '%%EOF[[:space:]]*$' then
      raise exception using errcode = '22023', message = error_message;
    end if;
  end if;
  return contents;
end $$;

create or replace function cms_intake_private.guard_join_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  fingerprint jsonb;
begin
  if new.form_version in (2, 3) then
    fingerprint := jsonb_build_object('guide',new.join_info_id,'name',new.applicant_name,'birth',new.birth_date,'phone',new.applicant_phone,
      'guardian',new.guardian_phone,'school',new.school,'parts',new.desired_parts,'motivation',new.motivation,'consent',new.privacy_agreed);
    if new.form_version = 3 then
      fingerprint := fingerprint || jsonb_build_object('version',3,'school_level',new.school_level,'grade',new.grade,
        'department',new.department,'gender',new.gender,'photo',new.photo_file_path,'recommendation',new.recommendation_file_path);
    end if;
    perform cms_intake_private.claim('join', new.submission_id, fingerprint, regexp_replace(new.applicant_phone, '[^0-9]', '', 'g'));
  end if;
  return new;
end $$;

create function public.get_join_application_config_v3(p_join_info_id uuid)
returns table (
  form_version smallint, server_now timestamptz, recruitment_starts_at timestamptz, recruitment_ends_at timestamptz
)
language sql stable security invoker set search_path = '' as $$
  select 3::smallint, config.server_now, config.recruitment_starts_at, config.recruitment_ends_at
  from public.get_join_application_config(p_join_info_id) config;
$$;

create function public.submit_join_application_v3(
  p_submission_id uuid, p_join_info_id uuid, p_applicant_name text, p_birth_date date,
  p_applicant_phone text, p_guardian_phone text, p_school text, p_desired_parts text[],
  p_motivation text, p_privacy_agreed boolean, p_school_level text, p_grade text,
  p_department text, p_gender text, p_photo jsonb, p_recommendation jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  normalized_name text := regexp_replace(p_applicant_name, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_school text := regexp_replace(p_school, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_grade text := regexp_replace(p_grade, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_department text := nullif(regexp_replace(p_department, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  normalized_motivation text := regexp_replace(p_motivation, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_applicant_phone text := regexp_replace(p_applicant_phone, '[^0-9+]', '', 'g');
  normalized_guardian_phone text := regexp_replace(p_guardian_phone, '[^0-9+]', '', 'g');
  normalized_parts text[];
  photo_contents bytea;
  recommendation_contents bytea;
  prior public.join_applications%rowtype;
  guide public.join_info%rowtype;
  checked_at timestamptz;
  application_id uuid;
begin
  if p_privacy_agreed is distinct from true then
    raise exception using errcode = '22023', message = '개인정보 수집 및 이용에 동의해 주세요.';
  end if;
  if p_submission_id is null or p_join_info_id is null
    or p_submission_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or cms_intake_private.text_ok(to_jsonb(normalized_name), 100, true) is not true
    or p_birth_date is null or not isfinite(p_birth_date)
    or p_birth_date > (statement_timestamp() at time zone 'Asia/Seoul')::date
    or cms_intake_private.phone_ok(to_jsonb(p_applicant_phone)) is not true
    or cms_intake_private.phone_ok(to_jsonb(p_guardian_phone)) is not true
    or cms_intake_private.text_ok(to_jsonb(normalized_school), 200, true) is not true
    or p_school_level is null or p_school_level not in ('elementary', 'middle', 'high', 'university', 'other')
    or cms_intake_private.text_ok(to_jsonb(normalized_grade), 24, true) is not true
    or (normalized_department is not null and (p_school_level <> 'university'
      or cms_intake_private.text_ok(to_jsonb(normalized_department), 120, true) is not true))
    or p_gender is null or p_gender not in ('female', 'male', 'not_specified')
    or cms_intake_private.text_ok(to_jsonb(normalized_motivation), 5000, true) is not true
    or p_desired_parts is null or cardinality(p_desired_parts) not between 1 and 4
    or array_ndims(p_desired_parts) <> 1 or array_position(p_desired_parts, null) is not null
    or not p_desired_parts <@ array['soprano','alto','tenor','bass']::text[] then
    raise exception using errcode = '22023', message = '필수 항목과 입력 내용을 확인해 주세요.';
  end if;

  select array_agg(part order by array_position(array['soprano','alto','tenor','bass']::text[],part))
    into normalized_parts from (select distinct unnest(p_desired_parts) as part) parts;
  photo_contents := cms_intake_private.validate_join_attachment(p_photo, 'photo');
  recommendation_contents := cms_intake_private.validate_join_attachment(p_recommendation, 'recommendation');

  -- Match the v2 request lock so both forms share opaque-ID retry semantics.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_submission_id::text, 0));
  select * into prior from public.join_applications where submission_id = p_submission_id;
  if found then
    if prior.form_version = 3 and prior.join_info_id = p_join_info_id
      and prior.applicant_name = normalized_name and prior.birth_date = p_birth_date
      and prior.applicant_phone = normalized_applicant_phone and prior.guardian_phone = normalized_guardian_phone
      and prior.school = normalized_school and prior.school_level = p_school_level and prior.grade = normalized_grade
      and prior.department is not distinct from normalized_department and prior.gender = p_gender
      and prior.desired_parts = normalized_parts and prior.motivation = normalized_motivation
      and prior.privacy_agreed = p_privacy_agreed
      and (select a.contents from cms_intake_private.join_application_attachments a where a.application_id = prior.id and a.kind = 'photo')
        is not distinct from photo_contents
      and (select a.contents from cms_intake_private.join_application_attachments a where a.application_id = prior.id and a.kind = 'recommendation')
        is not distinct from recommendation_contents then
      return true;
    end if;
    raise exception using errcode = '22023', message = '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.';
  end if;

  select * into guide from public.join_info where id = p_join_info_id for share;
  checked_at := clock_timestamp();
  if not found or guide.is_visible is distinct from true
    or (guide.recruitment_starts_at is not null and checked_at < guide.recruitment_starts_at)
    or (guide.recruitment_ends_at is not null and checked_at >= guide.recruitment_ends_at) then
    raise exception using errcode = '22023', message = '현재 지원서를 접수할 수 없습니다. 최신 입단 안내를 확인해 주세요.';
  end if;

  insert into public.join_applications (
    form_version, submission_id, join_info_id, applicant_name, birth_date, applicant_phone, guardian_phone,
    school, school_level, grade, department, gender, desired_parts, motivation, privacy_agreed,
    status, admin_notes, is_archived, created_at, desired_part, guardian_name, choir_experience, lesson_experience,
    photo_file_path, recommendation_file_path
  ) values (
    3, p_submission_id, p_join_info_id, normalized_name, p_birth_date, normalized_applicant_phone, normalized_guardian_phone,
    normalized_school, p_school_level, normalized_grade, normalized_department, p_gender, normalized_parts, normalized_motivation,
    true, 'new', null, false, checked_at, null, null, null, null,
    case when photo_contents is not null then 'join-intake-v3:photo' end,
    case when recommendation_contents is not null then 'join-intake-v3:recommendation' end
  ) returning id into application_id;

  if photo_contents is not null then
    insert into cms_intake_private.join_application_attachments(application_id, kind, media_type, contents)
      values(application_id, 'photo', p_photo ->> 'media_type', photo_contents);
  end if;
  if recommendation_contents is not null then
    insert into cms_intake_private.join_application_attachments(application_id, kind, media_type, contents)
      values(application_id, 'recommendation', p_recommendation ->> 'media_type', recommendation_contents);
  end if;
  return true;
end $$;

create function public.get_join_application_attachment_v3(p_application_id uuid, p_kind text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception using errcode = '42501', message = '관리자 권한이 필요합니다.';
  end if;
  return (
    select jsonb_build_object('media_type', a.media_type, 'base64', replace(encode(a.contents, 'base64'), chr(10), ''))
    from cms_intake_private.join_application_attachments a
    where a.application_id = p_application_id and a.kind = p_kind
  );
end $$;

revoke all on function cms_intake_private.join_photo_portrait_ok(bytea, text) from public, anon, authenticated;
revoke all on function cms_intake_private.validate_join_attachment(jsonb, text) from public, anon, authenticated;
revoke all on function public.get_join_application_config_v3(uuid) from public, anon, authenticated;
revoke all on function public.submit_join_application_v3(uuid, uuid, text, date, text, text, text, text[], text, boolean, text, text, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.get_join_application_attachment_v3(uuid, text) from public, anon, authenticated;
grant execute on function public.get_join_application_config_v3(uuid) to anon, authenticated;
grant execute on function public.submit_join_application_v3(uuid, uuid, text, date, text, text, text, text[], text, boolean, text, text, text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_join_application_attachment_v3(uuid, text) to authenticated;
notify pgrst, 'reload schema';
commit;
