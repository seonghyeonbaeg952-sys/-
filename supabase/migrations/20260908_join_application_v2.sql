-- Versioned admissions form for the live contract inspected on 2026-09-08.
-- Existing records, legacy requirements, status values, admin roles and Storage policies are preserved.
-- This is intentionally fail-closed: review unexpected live metadata before any alteration.
begin;

create temporary table join_v2_expected_contract (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  birth_date date not null,
  gender text not null default 'not_specified',
  school text not null,
  grade text not null,
  desired_part text not null,
  guardian_name text not null,
  guardian_phone text not null,
  choir_experience text not null default 'no',
  lesson_experience text not null default 'no',
  motivation text not null,
  privacy_agreed boolean not null default false,
  status text not null default 'new',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  region text, photo_file_path text, applicant_phone text, email text, contact_time text,
  music_experience text, awards text, vision text, recommender_name text,
  recommender_affiliation text, recommender_reason text, recommendation_file_path text, admin_notes text,
  constraint expected_choir check (choir_experience in ('yes','no')),
  constraint expected_lesson check (lesson_experience in ('yes','no')),
  constraint expected_gender check (gender in ('female','male','not_specified')),
  constraint expected_part check (desired_part in ('soprano','alto','tenor','bass','unsure')),
  constraint expected_contact_time check (contact_time is null or contact_time in ('morning','afternoon','evening','text_first','call_available')),
  constraint expected_status check (status in ('new','contacted','audition_guided','on_hold','done')),
  constraint expected_required check (
    coalesce(length(btrim(applicant_name)),0)>0
    and coalesce(length(btrim(applicant_phone)),0)>0
    and coalesce(length(btrim(email)),0)>0
  ),
  constraint expected_required_text check (
    length(btrim(applicant_name))>0 and birth_date is not null and gender in ('female','male')
    and length(btrim(school))>0 and length(btrim(grade))>0 and length(btrim(coalesce(region,'')))>0
    and desired_part in ('soprano','alto','tenor','bass','unsure') and length(btrim(coalesce(photo_file_path,'')))>0
    and length(btrim(coalesce(applicant_phone,'')))>0 and length(btrim(guardian_name))>0
    and length(btrim(guardian_phone))>0 and length(btrim(coalesce(email,'')))>0 and contact_time is not null
    and contact_time in ('morning','afternoon','evening','text_first','call_available')
    and length(btrim(coalesce(music_experience,'')))>0 and length(btrim(coalesce(awards,'')))>0
    and length(btrim(motivation))>0 and length(btrim(coalesce(vision,'')))>0
  )
) on commit drop;

create policy expected_public_insert on join_v2_expected_contract for insert
to anon, authenticated with check (
  privacy_agreed = true and status = 'new'
  and coalesce(is_archived, false) = false and admin_notes is null
  and photo_file_path is not null and length(btrim(photo_file_path)) > 0
);
create policy expected_admin_access on join_v2_expected_contract for all
to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

do $$
declare
  actual_constraint record;
  expected_policy record;
  actual_policy record;
begin
  if to_regclass('public.join_applications') is null or to_regclass('public.join_info') is null then
    raise exception 'Admissions v2 requires existing join_applications and join_info tables.';
  end if;
  if not exists (select 1 from pg_roles where rolname = current_user and (rolsuper or rolbypassrls)) then
    raise exception 'Admissions v2 must be installed by the privileged migration owner.';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.join_applications'::regclass and not attisdropped and attname in ('form_version', 'submission_id', 'desired_parts', 'join_info_id')) then
    raise exception 'Admissions v2 columns already exist; inspect migration history before applying.';
  end if;
  if not (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.join_applications'::regclass)
    or has_table_privilege('anon', 'public.join_applications', 'SELECT') then
    raise exception 'Unexpected admissions RLS/read grants; review the live contract first.';
  end if;

  -- Compare all live column types, nullability and defaults against inspected metadata.
  if exists (
    with attributes as (
      select a.attrelid, a.attname, a.atttypid, a.atttypmod, a.attnotnull, a.attidentity, a.attgenerated,
        pg_get_expr(d.adbin,d.adrelid) as default_expression
      from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
      where a.attrelid in ('public.join_applications'::regclass,'pg_temp.join_v2_expected_contract'::regclass)
        and a.attnum>0 and not a.attisdropped
    )
    select 1
    from (select * from attributes where attrelid='public.join_applications'::regclass) a
    full join (select * from attributes where attrelid='pg_temp.join_v2_expected_contract'::regclass) e
      on e.attname=a.attname
    where a.attname is null or e.attname is null
      or (a.atttypid,a.atttypmod,a.attnotnull,a.attidentity,a.attgenerated,a.default_expression)
        is distinct from (e.atttypid,e.atttypmod,e.attnotnull,e.attidentity,e.attgenerated,e.default_expression)
  ) then
    raise exception 'Unexpected admissions column contract; review the live metadata first.';
  end if;

  if (select count(*) from pg_constraint where conrelid='public.join_applications'::regclass)
    <> (select count(*) from pg_constraint where conrelid='pg_temp.join_v2_expected_contract'::regclass) then
    raise exception 'Unexpected admissions constraint set; review the live contract first.';
  end if;
  for actual_constraint in select contype, conname,
    regexp_replace(pg_get_constraintdef(oid),' NOT VALID$','') as definition
    from pg_constraint where conrelid='public.join_applications'::regclass
  loop
    if (select count(*) from pg_constraint e
      where e.conrelid='pg_temp.join_v2_expected_contract'::regclass
        and e.contype=actual_constraint.contype
        and pg_get_constraintdef(e.oid)=actual_constraint.definition) <> 1 then
      raise exception 'Unknown admissions constraint %; review the live contract first.', actual_constraint.conname;
    end if;
  end loop;

  if (select count(*) from pg_policy where polrelid = 'public.join_applications'::regclass) <> 2 then
    raise exception 'Unexpected admissions policies; review the live contract first.';
  end if;
  for expected_policy in select * from pg_policy where polrelid = 'pg_temp.join_v2_expected_contract'::regclass
  loop
    select * into actual_policy from pg_policy where polrelid = 'public.join_applications'::regclass
      and polcmd = expected_policy.polcmd and polpermissive = expected_policy.polpermissive
      and polroles = expected_policy.polroles
      and pg_get_expr(polqual, polrelid) is not distinct from pg_get_expr(expected_policy.polqual, expected_policy.polrelid)
      and pg_get_expr(polwithcheck, polrelid) is not distinct from pg_get_expr(expected_policy.polwithcheck, expected_policy.polrelid);
    if not found then raise exception 'Unrecognised admissions access policy; review the live contract first.'; end if;
    -- Only replace the verified visitor INSERT policy; keep the live admin policy intact.
    if actual_policy.polcmd = 'a' then
      execute format('drop policy %I on public.join_applications', actual_policy.polname);
    end if;
  end loop;
end;
$$;

alter table public.join_info
  add column recruitment_starts_at timestamptz,
  add column recruitment_ends_at timestamptz,
  add constraint join_info_recruitment_period_check check (
    (recruitment_starts_at is null or isfinite(recruitment_starts_at))
    and (recruitment_ends_at is null or isfinite(recruitment_ends_at))
    and (recruitment_starts_at is null or recruitment_ends_at is null or recruitment_starts_at < recruitment_ends_at)
  );
comment on column public.join_info.recruitment_starts_at is 'Inclusive opening instant. CMS displays/edits Asia/Seoul; NULL is unbounded.';
comment on column public.join_info.recruitment_ends_at is 'Exclusive closing instant. CMS displays/edits Asia/Seoul; both bounds NULL preserves year-round admission.';

alter table public.join_applications
  alter column grade drop not null,
  alter column desired_part drop not null,
  alter column guardian_name drop not null,
  alter column gender drop not null,
  alter column choir_experience drop not null,
  alter column lesson_experience drop not null,
  add column form_version smallint not null default 1,
  add column desired_parts text[],
  add column submission_id uuid,
  add column join_info_id uuid,
  add constraint join_applications_submission_id_key unique (submission_id),
  add constraint join_applications_form_version_check check (form_version in (1, 2)),
  add constraint join_applications_v1_not_null_check check (
    form_version <> 1 or (grade is not null and desired_part is not null and guardian_name is not null
      and gender is not null and choir_experience is not null and lesson_experience is not null)
  ) not valid,
  add constraint join_applications_versioned_required_check check (
    coalesce(length(btrim(applicant_name)), 0) > 0
    and coalesce(length(btrim(applicant_phone)), 0) > 0
    and (
      (form_version = 1 and coalesce(length(btrim(email)), 0) > 0)
      or (form_version = 2 and birth_date is not null and submission_id is not null and join_info_id is not null
        and coalesce(length(btrim(guardian_phone)), 0) > 0
        and coalesce(length(btrim(school)), 0) > 0
        and coalesce(length(btrim(motivation)), 0) > 0
        and privacy_agreed = true
        and desired_parts is not null and cardinality(desired_parts) between 1 and 4
        and array_position(desired_parts, null) is null
        and desired_parts <@ array['soprano','alto','tenor','bass']::text[])
    )
  ) not valid;
-- NOT VALID preserves historic records; all future inserts/updates must satisfy the versioned contract.
comment on column public.join_applications.form_version is '1: existing full form, preserved unchanged. 2: seven required answers and explicit privacy consent via RPC.';
comment on column public.join_applications.join_info_id is 'Guide selected at submission. Historical identifier retained even if a guide is later removed; RPC verifies the live guide.';

-- Preserve each original required expression verbatim for v1; do not rewrite legacy rows.
-- Other enum/status constraints and the original defaults remain exactly as inspected.
do $$
declare legacy_required record;
begin
  for legacy_required in
    select c.conname, pg_get_expr(c.conbin,c.conrelid) as expression
    from pg_constraint c where c.conrelid='public.join_applications'::regclass and c.contype='c'
      and exists (select 1 from pg_constraint e
        where e.conrelid='pg_temp.join_v2_expected_contract'::regclass
          and e.conname in ('expected_required','expected_required_text')
          and pg_get_expr(e.conbin,e.conrelid)=pg_get_expr(c.conbin,c.conrelid))
  loop
    execute format('alter table public.join_applications drop constraint %I',legacy_required.conname);
    execute format('alter table public.join_applications add constraint %I check (form_version <> 1 or (%s)) not valid',
      legacy_required.conname,legacy_required.expression);
  end loop;
end;
$$;

create policy join_applications_public_insert on public.join_applications for insert
to anon, authenticated with check (
  form_version = 1 and submission_id is null and desired_parts is null
  and privacy_agreed = true and status = 'new' and coalesce(is_archived, false) = false
  and admin_notes is null and photo_file_path is not null and length(btrim(photo_file_path)) > 0
  and exists (
    select 1 from public.join_info g where g.is_visible = true
      and (g.recruitment_starts_at is null or g.recruitment_starts_at <= statement_timestamp())
      and (g.recruitment_ends_at is null or statement_timestamp() < g.recruitment_ends_at)
  )
);

create function public.submit_join_application_v2(
  p_submission_id uuid,
  p_join_info_id uuid,
  p_applicant_name text,
  p_birth_date date,
  p_applicant_phone text,
  p_guardian_phone text,
  p_school text,
  p_desired_parts text[],
  p_motivation text,
  p_privacy_agreed boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_parts text[];
  normalized_name text := regexp_replace(p_applicant_name, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_school text := regexp_replace(p_school, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_motivation text := regexp_replace(p_motivation, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  normalized_applicant_phone text;
  normalized_guardian_phone text;
  prior public.join_applications%rowtype;
  guide public.join_info%rowtype;
  checked_at timestamptz;
begin
  if p_submission_id is null or p_join_info_id is null then
    raise exception using errcode = '22023', message = '제출 요청을 확인한 뒤 다시 시도해 주세요.';
  end if;
  if p_privacy_agreed is distinct from true then
    raise exception using errcode = '22023', message = '개인정보 수집 및 이용에 동의해 주세요.';
  end if;
  if coalesce(length(normalized_name), 0) not between 1 and 100
    or p_birth_date is null or not isfinite(p_birth_date)
    or p_birth_date > (statement_timestamp() at time zone 'Asia/Seoul')::date
    or coalesce(btrim(p_applicant_phone), '') !~ '^[+]?[0-9 ()-]+$'
    or coalesce(btrim(p_guardian_phone), '') !~ '^[+]?[0-9 ()-]+$'
    or length(regexp_replace(coalesce(p_applicant_phone, ''), '[^0-9]', '', 'g')) not between 9 and 15
    or length(regexp_replace(coalesce(p_guardian_phone, ''), '[^0-9]', '', 'g')) not between 9 and 15
    or coalesce(length(normalized_school), 0) not between 1 and 200
    or coalesce(length(normalized_motivation), 0) not between 1 and 5000
    or p_desired_parts is null or cardinality(p_desired_parts) not between 1 and 4
    or array_ndims(p_desired_parts) <> 1 or array_position(p_desired_parts, null) is not null
    or not p_desired_parts <@ array['soprano','alto','tenor','bass']::text[] then
    raise exception using errcode = '22023', message = '필수 항목과 입력 내용을 확인해 주세요.';
  end if;
  select array_agg(part order by array_position(array['soprano','alto','tenor','bass']::text[],part))
    into normalized_parts from (select distinct unnest(p_desired_parts) as part) parts;
  normalized_applicant_phone := regexp_replace(p_applicant_phone, '[^0-9+]', '', 'g');
  normalized_guardian_phone := regexp_replace(p_guardian_phone, '[^0-9+]', '', 'g');

  -- Serialize only retries for this opaque random ID. No personal data is returned.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_submission_id::text, 0));
  select * into prior from public.join_applications where submission_id = p_submission_id;
  if found then
    if prior.form_version = 2 and prior.join_info_id = p_join_info_id
      and prior.applicant_name = normalized_name and prior.birth_date = p_birth_date
      and prior.applicant_phone = normalized_applicant_phone and prior.guardian_phone = normalized_guardian_phone
      and prior.school = normalized_school and prior.desired_parts = normalized_parts
      and prior.motivation = normalized_motivation and prior.privacy_agreed = p_privacy_agreed then
      return true;
    end if;
    raise exception using errcode = '22023', message = '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.';
  end if;

  -- Share lock prevents an overlapping CMS edit from silently moving the gate during this insert.
  select * into guide from public.join_info where id = p_join_info_id for share;
  checked_at := clock_timestamp();
  if not found or guide.is_visible is distinct from true
    or (guide.recruitment_starts_at is not null and checked_at < guide.recruitment_starts_at)
    or (guide.recruitment_ends_at is not null and checked_at >= guide.recruitment_ends_at) then
    raise exception using errcode = '22023', message = '현재 지원서를 접수할 수 없습니다. 최신 입단 안내를 확인해 주세요.';
  end if;

  insert into public.join_applications (
    form_version, submission_id, join_info_id, applicant_name, birth_date,
    applicant_phone, guardian_phone, school, desired_parts, motivation,
    privacy_agreed, status, admin_notes, is_archived, created_at,
    grade, desired_part, guardian_name, gender, choir_experience, lesson_experience
  ) values (
    2, p_submission_id, p_join_info_id, normalized_name, p_birth_date,
    normalized_applicant_phone, normalized_guardian_phone, normalized_school, normalized_parts, normalized_motivation,
    p_privacy_agreed, 'new', null, false, checked_at,
    null, null, null, null, null, null
  );
  return true;
end;
$$;

revoke all on function public.submit_join_application_v2(uuid, uuid, text, date, text, text, text, text[], text, boolean) from public;
grant execute on function public.submit_join_application_v2(uuid, uuid, text, date, text, text, text, text[], text, boolean) to anon, authenticated;
comment on function public.submit_join_application_v2(uuid, uuid, text, date, text, text, text, text[], text, boolean)
  is 'Seven required answers plus explicit consent. Idempotent opaque submission ID; server-enforced published guide and recruitment bounds. Returns success only, never a private record.';

create function public.get_join_application_config(p_join_info_id uuid)
returns table (
  form_version smallint,
  server_now timestamptz,
  recruitment_starts_at timestamptz,
  recruitment_ends_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select 2::smallint, statement_timestamp(), g.recruitment_starts_at, g.recruitment_ends_at
  from public.join_info g
  where g.id = p_join_info_id and g.is_visible = true;
$$;
revoke all on function public.get_join_application_config(uuid) from public;
grant execute on function public.get_join_application_config(uuid) to anon, authenticated;
comment on function public.get_join_application_config(uuid)
  is 'GET-safe readiness and authoritative clock for a published guide only. Does not read applications or private data.';

commit;
