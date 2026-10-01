-- Separate media workspace: does not modify either language's text documents.
create table public.site_photo_overrides (
  asset_key text primary key check (asset_key ~ '^[a-z][a-z0-9-]{0,99}$'),
  draft jsonb,
  published jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by uuid references auth.users(id)
);
alter table public.site_photo_overrides enable row level security;
revoke all on public.site_photo_overrides from anon, authenticated;
grant select on public.site_photo_overrides to authenticated;
create policy site_photo_overrides_admin_read on public.site_photo_overrides
  for select to authenticated using ((select public.is_admin()));

create function public.validate_site_photo(p_photo jsonb) returns void
language plpgsql immutable set search_path = public, pg_temp as $$
declare photo_url text;
begin
  if p_photo is null or p_photo = 'null'::jsonb then return; end if;
  if jsonb_typeof(p_photo) <> 'object' or not p_photo ?& array['src','altKo','altEn','positionX','positionY']
    or exists(select 1 from jsonb_object_keys(p_photo) k where k not in ('src','altKo','altEn','positionX','positionY')) then
    raise exception 'Invalid photo fields' using errcode = '22023';
  end if;
  photo_url := p_photo->>'src';
  if jsonb_typeof(p_photo->'src') <> 'string' or length(photo_url) not between 1 and 2048
    or photo_url ~ '[[:space:]"''<>\\()]'
    or not (photo_url ~ '^https://[^/@:]+(:[0-9]+)?(/|$)' or (photo_url ~ '^/images/[a-zA-Z0-9_./-]+$' and position('..' in photo_url) = 0))
    or jsonb_typeof(p_photo->'altKo') <> 'string' or length(p_photo->>'altKo') > 500
    or jsonb_typeof(p_photo->'altEn') <> 'string' or length(p_photo->>'altEn') > 500
    or jsonb_typeof(p_photo->'positionX') <> 'number' or jsonb_typeof(p_photo->'positionY') <> 'number' then
    raise exception 'Invalid photo metadata' using errcode = '22023';
  end if;
  if (p_photo->>'positionX')::numeric not between 0 and 100 or (p_photo->>'positionY')::numeric not between 0 and 100 then
    raise exception 'Invalid focal position' using errcode = '22023';
  end if;
end $$;
revoke all on function public.validate_site_photo(jsonb) from public, anon, authenticated;

create function public.save_site_photo_draft(p_asset_key text, p_photo jsonb, p_expected_version bigint)
returns public.site_photo_overrides language plpgsql security definer set search_path = public, pg_temp as $$
declare result public.site_photo_overrides;
begin
  if public.is_admin() is distinct from true then raise exception 'Admin only' using errcode = '42501'; end if;
  if p_asset_key is null or p_asset_key !~ '^[a-z][a-z0-9-]{0,99}$' or p_expected_version is null or p_expected_version < 0 then
    raise exception 'Invalid key/version' using errcode = '22023';
  end if;
  perform public.validate_site_photo(p_photo);
  if p_expected_version = 0 then
    insert into public.site_photo_overrides(asset_key, draft, updated_by)
      values(p_asset_key, nullif(p_photo, 'null'::jsonb), auth.uid()) on conflict do nothing returning * into result;
  else
    update public.site_photo_overrides set draft = nullif(p_photo, 'null'::jsonb), version = version + 1, updated_at = now(), updated_by = auth.uid()
      where asset_key = p_asset_key and version = p_expected_version returning * into result;
  end if;
  if result.asset_key is null then raise exception 'Photo changed concurrently' using errcode = '40001'; end if;
  return result;
end $$;

create function public.publish_site_photo(p_asset_key text, p_expected_version bigint)
returns public.site_photo_overrides language plpgsql security definer set search_path = public, pg_temp as $$
declare result public.site_photo_overrides;
begin
  if public.is_admin() is distinct from true then raise exception 'Admin only' using errcode = '42501'; end if;
  update public.site_photo_overrides set published = draft, version = version + 1,
    published_at = now(), updated_at = now(), updated_by = auth.uid()
    where asset_key = p_asset_key and version = p_expected_version returning * into result;
  if result.asset_key is null then raise exception 'Photo changed concurrently' using errcode = '40001'; end if;
  return result;
end $$;

create function public.get_admin_site_photos() returns setof public.site_photo_overrides
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.is_admin() is distinct from true then raise exception 'Admin only' using errcode = '42501'; end if;
  return query select * from public.site_photo_overrides order by asset_key;
end $$;
create function public.get_public_site_photos() returns table(asset_key text, published jsonb, published_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select asset_key, published, published_at from public.site_photo_overrides where published is not null and published_at is not null;
$$;
revoke all on function public.save_site_photo_draft(text,jsonb,bigint), public.publish_site_photo(text,bigint), public.get_admin_site_photos(), public.get_public_site_photos() from public, anon, authenticated;
grant execute on function public.save_site_photo_draft(text,jsonb,bigint), public.publish_site_photo(text,bigint), public.get_admin_site_photos() to authenticated;
grant execute on function public.get_public_site_photos() to anon, authenticated;

-- YouTube artwork remains the fallback when no custom thumbnail is chosen.
alter table public.videos add column if not exists thumbnail_url text;
