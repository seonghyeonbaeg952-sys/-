-- Additive CMS editor. Existing content and site_texts remain unchanged.
-- Direct writes are deliberately unavailable, even to the authenticated client.
begin;

create function public.validate_site_editor_document(p_document jsonb)
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
  if exists (select 1 from jsonb_object_keys(p_document) k where k not in ('schemaVersion','copy','deviceCopy','appearance'))
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
end;
$$;
revoke all on function public.validate_site_editor_document(jsonb) from public, anon, authenticated;

create table public.site_editor_pages (
  page_key text primary key check (page_key in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')),
  draft jsonb not null,
  published jsonb,
  version bigint not null check (version between 1 and 9007199254740991),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz
);
create table public.site_editor_revisions (
  id uuid primary key default gen_random_uuid(),
  page_key text not null references public.site_editor_pages(page_key),
  document jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null
);
create index site_editor_revisions_page_date_idx on public.site_editor_revisions(page_key,published_at desc,id);
alter table public.site_editor_pages enable row level security;
alter table public.site_editor_pages force row level security;
alter table public.site_editor_revisions enable row level security;
alter table public.site_editor_revisions force row level security;
revoke all on public.site_editor_pages, public.site_editor_revisions from public, anon, authenticated;
grant select on public.site_editor_pages, public.site_editor_revisions to authenticated;
create policy site_editor_pages_admin_read on public.site_editor_pages for select to authenticated using ((select public.is_admin()));
create policy site_editor_revisions_admin_read on public.site_editor_revisions for select to authenticated using ((select public.is_admin()));

create function public.get_public_site_editor_pages()
returns table(page_key text, document jsonb, published_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.page_key, p.published, p.published_at
  from public.site_editor_pages p where p.published is not null order by p.page_key;
$$;
revoke all on function public.get_public_site_editor_pages() from public, anon, authenticated;
grant execute on function public.get_public_site_editor_pages() to anon, authenticated;
comment on function public.get_public_site_editor_pages() is 'Intentionally public, fixed published-only projection. Never exposes drafts, revisions or administrator identifiers.';

create function public.save_site_editor_draft(p_page_key text, p_document jsonb, p_expected_version bigint)
returns public.site_editor_pages language plpgsql security definer set search_path = ''
as $$
declare result public.site_editor_pages%rowtype;
begin
  if public.is_admin() is distinct from true then
    raise exception using errcode='42501', message='관리자 권한이 필요합니다.';
  end if;
  if p_page_key is null or p_page_key not in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')
    or p_expected_version is null or p_expected_version not between 0 and 9007199254740990 then
    raise exception using errcode='22023', message='페이지와 저장 버전을 확인해 주세요.';
  end if;
  perform public.validate_site_editor_document(p_document);
  -- One lock namespace per page serializes first inserts and subsequent mutations.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('site-editor:' || p_page_key, 0));
  select * into result from public.site_editor_pages where page_key=p_page_key for update;
  if not found then
    if p_expected_version <> 0 then
      raise exception using errcode='40001', message='다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
    end if;
    insert into public.site_editor_pages(page_key,draft,version,updated_at,updated_by)
      values (p_page_key,p_document,1,clock_timestamp(),auth.uid()) returning * into result;
  else
    if result.version <> p_expected_version then
      raise exception using errcode='40001', message='다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
    end if;
    update public.site_editor_pages set draft=p_document, version=version+1,
      updated_at=clock_timestamp(), updated_by=auth.uid()
      where page_key=p_page_key returning * into result;
  end if;
  return result;
end;
$$;

create function public.publish_site_editor_page(p_page_key text, p_expected_version bigint)
returns public.site_editor_pages language plpgsql security definer set search_path = ''
as $$
declare result public.site_editor_pages%rowtype; published_time timestamptz;
begin
  if public.is_admin() is distinct from true then
    raise exception using errcode='42501', message='관리자 권한이 필요합니다.';
  end if;
  if p_page_key is null or p_page_key not in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')
    or p_expected_version is null or p_expected_version not between 1 and 9007199254740990 then
    raise exception using errcode='22023', message='페이지와 게시 버전을 확인해 주세요.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('site-editor:' || p_page_key, 0));
  select * into result from public.site_editor_pages where page_key=p_page_key for update;
  if not found or result.version <> p_expected_version then
    raise exception using errcode='40001', message='다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
  end if;
  perform public.validate_site_editor_document(result.draft);
  published_time := clock_timestamp();
  insert into public.site_editor_revisions(page_key,document,published_at,published_by)
    values (p_page_key,result.draft,published_time,auth.uid());
  update public.site_editor_pages set published=draft,published_at=published_time,
    version=version+1,updated_at=published_time,updated_by=auth.uid()
    where page_key=p_page_key returning * into result;
  return result;
end;
$$;

create function public.restore_site_editor_revision(p_revision_id uuid, p_expected_version bigint)
returns public.site_editor_pages language plpgsql security definer set search_path = ''
as $$
declare revision public.site_editor_revisions%rowtype;
begin
  if public.is_admin() is distinct from true then
    raise exception using errcode='42501', message='관리자 권한이 필요합니다.';
  end if;
  select * into revision from public.site_editor_revisions where id=p_revision_id;
  if not found then raise exception using errcode='22023', message='복원할 게시 이력을 찾지 못했습니다.'; end if;
  return public.save_site_editor_draft(revision.page_key,revision.document,p_expected_version);
end;
$$;

revoke all on function public.save_site_editor_draft(text,jsonb,bigint) from public,anon,authenticated;
revoke all on function public.publish_site_editor_page(text,bigint) from public,anon,authenticated;
revoke all on function public.restore_site_editor_revision(uuid,bigint) from public,anon,authenticated;
grant execute on function public.save_site_editor_draft(text,jsonb,bigint) to authenticated;
grant execute on function public.publish_site_editor_page(text,bigint) to authenticated;
grant execute on function public.restore_site_editor_revision(uuid,bigint) to authenticated;
comment on table public.site_editor_pages is 'Private drafts and separately published snapshots. Mutations require admin RPC plus expected version.';
comment on table public.site_editor_revisions is 'Administrator-only immutable publication history. Restoration changes a draft, not the live site.';

notify pgrst, 'reload schema';
commit;
