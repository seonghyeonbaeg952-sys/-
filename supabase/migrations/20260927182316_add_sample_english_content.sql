-- Version aligned to the additive migration applied through the project API.
begin;

-- Language variants have their own drafts, publications and version locks.
-- No original content table, policy or publication is changed.
create table public.sample_english_content (
  resource text not null check (resource in ('notices','gallery','concerts','videos','posters','hero_slides','popup_notices','history','faq','about_sections','sponsors')),
  record_id uuid not null,
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  version bigint not null check (version between 1 and 9007199254740991),
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  primary key (resource, record_id),
  check ((published is null) = (published_at is null))
);
alter table public.sample_english_content enable row level security;
alter table public.sample_english_content force row level security;
revoke all on public.sample_english_content from public, anon, authenticated;
grant select on public.sample_english_content to authenticated;
create policy sample_english_content_admin_read on public.sample_english_content
  for select to authenticated using ((select public.is_admin()));

create function public.validate_sample_english_content(p_resource text, p_fields jsonb)
returns void language plpgsql immutable security invoker set search_path = '' as $$
declare
  allowed text[];
  item record;
  value text;
begin
  allowed := case p_resource
    when 'notices' then array['title','content','cover_image_url']
    when 'gallery' then array['title','description','image_url']
    when 'concerts' then array['title','location','description','program','performers','poster_url']
    when 'videos' then array['title','description','youtube_url','thumbnail_url']
    when 'posters' then array['title','image_url']
    when 'hero_slides' then array['title','subtitle','description','image_alt','image_url','primary_cta_label','secondary_cta_label']
    when 'popup_notices' then array['title','content','image_url','image_alt','button_label']
    when 'history' then array['title','content','image_url']
    when 'faq' then array['question','answer']
    when 'about_sections' then array['title','content']
    when 'sponsors' then array['name','display_name','description','logo_url']
    else null end;
  if allowed is null or p_fields is null or pg_catalog.jsonb_typeof(p_fields) <> 'object'
    or pg_catalog.length(p_fields::text) > 100000 then
    raise exception using errcode='22023', message='영문 콘텐츠를 확인해 주세요.';
  end if;
  for item in select key, val from pg_catalog.jsonb_each(p_fields) as t(key,val) loop
    value := item.val #>> '{}';
    if not (item.key = any(allowed)) or pg_catalog.jsonb_typeof(item.val) <> 'string'
      or pg_catalog.length(value) > 10000 or value ~ '<[^>]*>' then
      raise exception using errcode='22023', message='허용된 영문 문구와 이미지 항목을 확인해 주세요.';
    end if;
    if item.key like '%\_url' escape '\' and value <> '' and value !~ '^(https?://[^[:space:]<>]+|/[^/[:space:]<>][^[:space:]<>]*)$' then
      raise exception using errcode='22023', message='영문 이미지와 영상 주소를 확인해 주세요.';
    end if;
    if item.key = 'youtube_url' and value <> '' and value !~ '^https?://(www\.|m\.)?youtube\.com/|^https?://youtu\.be/' then
      raise exception using errcode='22023', message='YouTube 영상 주소를 확인해 주세요.';
    end if;
  end loop;
end;
$$;
revoke all on function public.validate_sample_english_content(text,jsonb) from public, anon, authenticated;

-- Only the projection/save routines call this bounded helper. Dynamic SQL is
-- limited to a fixed list of public content tables; arbitrary table names fail.
create function public.sample_english_content_source_exists(p_resource text, p_record_id uuid, p_visible_only boolean)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare result boolean;
begin
  if p_resource is null or p_resource not in ('notices','gallery','concerts','videos','posters','hero_slides','popup_notices','history','faq','about_sections','sponsors') then return false; end if;
  execute pg_catalog.format('select exists(select 1 from public.%I where id=$1 and (not $2 or is_visible is true))', p_resource)
    into result using p_record_id, p_visible_only;
  return result;
end;
$$;
revoke all on function public.sample_english_content_source_exists(text,uuid,boolean) from public, anon, authenticated;

-- Narrow, parameter-free public projection: hidden/deleted source records and
-- private drafts can never be returned, including under an administrator login.
create function public.get_public_sample_english_content()
returns table(resource text, record_id uuid, published jsonb, published_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.resource,c.record_id,c.published,c.published_at from public.sample_english_content c
  where c.published is not null and public.sample_english_content_source_exists(c.resource,c.record_id,true)
  order by c.resource,c.record_id;
$$;
revoke all on function public.get_public_sample_english_content() from public, anon, authenticated;
grant execute on function public.get_public_sample_english_content() to anon, authenticated;

create function public.save_sample_english_content_draft(p_resource text, p_record_id uuid, p_fields jsonb, p_expected_version bigint)
returns public.sample_english_content language plpgsql security definer set search_path = '' as $$
declare result public.sample_english_content%rowtype;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then raise exception using errcode='42501', message='관리자 권한이 필요합니다.'; end if;
  if p_expected_version is null or p_expected_version not between 0 and 9007199254740990
    or p_record_id is null or not public.sample_english_content_source_exists(p_resource,p_record_id,false) then
    raise exception using errcode='22023', message='원본 항목과 저장 버전을 확인해 주세요.';
  end if;
  perform public.validate_sample_english_content(p_resource,p_fields);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-content:'||p_resource||':'||p_record_id::text,0));
  select c.* into result from public.sample_english_content c where c.resource=p_resource and c.record_id=p_record_id for update;
  if not found then
    if p_expected_version <> 0 then raise exception using errcode='40001', message='최신 버전을 확인해 주세요.'; end if;
    insert into public.sample_english_content(resource,record_id,draft,version,updated_by)
      values (p_resource,p_record_id,p_fields,1,auth.uid()) returning * into result;
  else
    if result.version <> p_expected_version then raise exception using errcode='40001', message='다른 관리자가 변경했습니다.'; end if;
    update public.sample_english_content c set draft=p_fields,version=c.version+1,updated_at=pg_catalog.clock_timestamp(),updated_by=auth.uid()
      where c.resource=p_resource and c.record_id=p_record_id returning c.* into result;
  end if;
  return result;
end;
$$;
revoke all on function public.save_sample_english_content_draft(text,uuid,jsonb,bigint) from public, anon, authenticated;
grant execute on function public.save_sample_english_content_draft(text,uuid,jsonb,bigint) to authenticated;

create function public.publish_sample_english_content(p_resource text, p_record_id uuid, p_expected_version bigint)
returns public.sample_english_content language plpgsql security definer set search_path = '' as $$
declare result public.sample_english_content%rowtype;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then raise exception using errcode='42501', message='관리자 권한이 필요합니다.'; end if;
  if p_expected_version is null or p_expected_version not between 1 and 9007199254740990
    or p_record_id is null or not public.sample_english_content_source_exists(p_resource,p_record_id,false) then
    raise exception using errcode='22023', message='원본 항목과 게시 버전을 확인해 주세요.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-content:'||p_resource||':'||p_record_id::text,0));
  select c.* into result from public.sample_english_content c where c.resource=p_resource and c.record_id=p_record_id for update;
  if not found or result.version <> p_expected_version then raise exception using errcode='40001', message='최신 버전을 확인해 주세요.'; end if;
  perform public.validate_sample_english_content(p_resource,result.draft);
  update public.sample_english_content c set published=c.draft,published_at=pg_catalog.clock_timestamp(),version=c.version+1,
    updated_at=pg_catalog.clock_timestamp(),updated_by=auth.uid()
    where c.resource=p_resource and c.record_id=p_record_id returning c.* into result;
  return result;
end;
$$;
revoke all on function public.publish_sample_english_content(text,uuid,bigint) from public, anon, authenticated;
grant execute on function public.publish_sample_english_content(text,uuid,bigint) to authenticated;
commit;
