-- Independent English editing for /sample/ only. No original editor row,
-- publication, grant or function is changed by this migration.
-- Version matches the migration applied through the Supabase project API.
begin;

create table public.sample_english_editor_pages (
  page_key text primary key check (page_key in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')),
  draft jsonb not null,
  published jsonb,
  version bigint not null check (version between 1 and 9007199254740991),
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  check ((published is null) = (published_at is null))
);

create table public.sample_english_editor_revisions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  page_key text not null references public.sample_english_editor_pages(page_key),
  document jsonb not null,
  published_at timestamptz not null default pg_catalog.now(),
  published_by uuid references auth.users(id) on delete set null
);

create index sample_english_editor_revisions_page_date_idx
  on public.sample_english_editor_revisions(page_key, published_at desc, id);

alter table public.sample_english_editor_pages enable row level security;
alter table public.sample_english_editor_pages force row level security;
alter table public.sample_english_editor_revisions enable row level security;
alter table public.sample_english_editor_revisions force row level security;

-- Browser clients may read drafts only after the existing administrator check.
-- All writes go through the restricted, versioned RPCs below.
revoke all on public.sample_english_editor_pages, public.sample_english_editor_revisions
  from public, anon, authenticated;
grant select on public.sample_english_editor_pages, public.sample_english_editor_revisions
  to authenticated;

create policy sample_english_editor_pages_admin_read
  on public.sample_english_editor_pages for select to authenticated
  using ((select public.is_admin()));
create policy sample_english_editor_revisions_admin_read
  on public.sample_english_editor_revisions for select to authenticated
  using ((select public.is_admin()));

-- This narrow public projection intentionally bypasses private-draft RLS.
-- It has no parameters and cannot return drafts, revisions or administrator IDs.
create function public.get_public_sample_english_editor_pages()
returns table(page_key text, document jsonb, published_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.page_key, p.published, p.published_at
  from public.sample_english_editor_pages p
  where p.published is not null and p.published_at is not null
  order by p.page_key;
$$;

revoke all on function public.get_public_sample_english_editor_pages()
  from public, anon, authenticated;
grant execute on function public.get_public_sample_english_editor_pages()
  to anon, authenticated;

create function public.save_sample_english_editor_draft(
  p_page_key text,
  p_document jsonb,
  p_expected_version bigint
)
returns public.sample_english_editor_pages
language plpgsql security definer set search_path = ''
as $$
declare
  result public.sample_english_editor_pages%rowtype;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception using errcode = '42501', message = '관리자 권한이 필요합니다.';
  end if;
  if p_page_key is null
    or p_page_key not in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')
    or p_expected_version is null
    or p_expected_version not between 0 and 9007199254740990 then
    raise exception using errcode = '22023', message = '페이지와 저장 버전을 확인해 주세요.';
  end if;
  perform public.validate_site_editor_document(p_document);

  -- Separate from the original editor lock, including simultaneous first saves.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sample-english-editor:' || p_page_key, 0)
  );
  select p.* into result
    from public.sample_english_editor_pages p
    where p.page_key = p_page_key for update;

  if not found then
    if p_expected_version <> 0 then
      raise exception using errcode = '40001', message = '다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
    end if;
    insert into public.sample_english_editor_pages(page_key, draft, version, updated_at, updated_by)
      values (p_page_key, p_document, 1, pg_catalog.clock_timestamp(), auth.uid())
      returning * into result;
  else
    if result.version <> p_expected_version then
      raise exception using errcode = '40001', message = '다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
    end if;
    update public.sample_english_editor_pages as p
      set draft = p_document, version = p.version + 1,
        updated_at = pg_catalog.clock_timestamp(), updated_by = auth.uid()
      where p.page_key = p_page_key returning p.* into result;
  end if;
  return result;
end;
$$;

create function public.publish_sample_english_editor_page(
  p_page_key text,
  p_expected_version bigint
)
returns public.sample_english_editor_pages
language plpgsql security definer set search_path = ''
as $$
declare
  result public.sample_english_editor_pages%rowtype;
  published_time timestamptz;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception using errcode = '42501', message = '관리자 권한이 필요합니다.';
  end if;
  if p_page_key is null
    or p_page_key not in ('common','home','about','spirit','conductor','accompanist','members','history','concerts','concert-detail','notices','notice-detail','gallery','join','contact')
    or p_expected_version is null
    or p_expected_version not between 1 and 9007199254740990 then
    raise exception using errcode = '22023', message = '페이지와 게시 버전을 확인해 주세요.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('sample-english-editor:' || p_page_key, 0)
  );
  select p.* into result
    from public.sample_english_editor_pages p
    where p.page_key = p_page_key for update;
  if not found or result.version <> p_expected_version then
    raise exception using errcode = '40001', message = '다른 관리자가 변경했습니다. 최신 내용을 확인해 주세요.';
  end if;
  perform public.validate_site_editor_document(result.draft);

  published_time := pg_catalog.clock_timestamp();
  insert into public.sample_english_editor_revisions(page_key, document, published_at, published_by)
    values (p_page_key, result.draft, published_time, auth.uid());
  update public.sample_english_editor_pages as p
    set published = p.draft, published_at = published_time,
      version = p.version + 1, updated_at = published_time, updated_by = auth.uid()
    where p.page_key = p_page_key returning p.* into result;
  return result;
end;
$$;

create function public.restore_sample_english_editor_revision(
  p_revision_id uuid,
  p_expected_version bigint
)
returns public.sample_english_editor_pages
language plpgsql security definer set search_path = ''
as $$
declare
  revision public.sample_english_editor_revisions%rowtype;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception using errcode = '42501', message = '관리자 권한이 필요합니다.';
  end if;
  if p_revision_id is null or p_expected_version is null
    or p_expected_version not between 0 and 9007199254740990 then
    raise exception using errcode = '22023', message = '복원할 게시 이력과 편집 버전을 확인해 주세요.';
  end if;
  select r.* into revision
    from public.sample_english_editor_revisions r where r.id = p_revision_id;
  if not found then
    raise exception using errcode = '22023', message = '복원할 게시 이력을 찾지 못했습니다.';
  end if;

  -- Revalidate and lock through this workspace's save RPC. Published content
  -- and publication history remain unchanged until a separate publish action.
  return public.save_sample_english_editor_draft(
    revision.page_key, revision.document, p_expected_version
  );
end;
$$;

revoke all on function public.save_sample_english_editor_draft(text,jsonb,bigint)
  from public, anon, authenticated;
revoke all on function public.publish_sample_english_editor_page(text,bigint)
  from public, anon, authenticated;
revoke all on function public.restore_sample_english_editor_revision(uuid,bigint)
  from public, anon, authenticated;
grant execute on function public.save_sample_english_editor_draft(text,jsonb,bigint)
  to authenticated;
grant execute on function public.publish_sample_english_editor_page(text,bigint)
  to authenticated;
grant execute on function public.restore_sample_english_editor_revision(uuid,bigint)
  to authenticated;

comment on table public.sample_english_editor_pages is
  'Independent English drafts and published snapshots for /sample/. Admin-only reads and versioned RPC writes; never original-site publication.';
comment on table public.sample_english_editor_revisions is
  'Administrator-only immutable English sample publication history. Restoration updates only the independent draft.';
comment on function public.get_public_sample_english_editor_pages() is
  'Intentionally public fixed projection of English sample publications only. Never exposes drafts, revisions or administrator identifiers.';
comment on function public.publish_sample_english_editor_page(text,bigint) is
  'Publishes a saved English sample draft only. Does not read or publish an original-site draft.';

notify pgrst, 'reload schema';
commit;
