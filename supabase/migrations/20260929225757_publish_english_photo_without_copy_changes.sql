-- Publishing a photo must not accidentally publish unrelated unfinished copy.
create function public.publish_sample_english_photo(p_resource text, p_record_id uuid, p_field text, p_expected_version bigint)
returns public.sample_english_content language plpgsql security definer set search_path = '' as $$
declare result public.sample_english_content%rowtype; allowed_field text; next_published jsonb;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then raise exception 'Admin only' using errcode='42501'; end if;
  allowed_field := case p_resource
    when 'hero_slides' then 'image_url' when 'popup_notices' then 'image_url' when 'gallery' then 'image_url'
    when 'posters' then 'image_url' when 'history' then 'image_url' when 'locations' then 'image_url'
    when 'concerts' then 'poster_url' when 'notices' then 'cover_image_url' when 'videos' then 'thumbnail_url'
    when 'sponsors' then 'logo_url' else null end;
  if allowed_field is null or p_field is distinct from allowed_field or p_expected_version is null
    or p_expected_version not between 1 and 9007199254740990
    or not public.sample_english_content_source_exists(p_resource,p_record_id,false) then
    raise exception 'Invalid image field/source/version' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-content:'||p_resource||':'||p_record_id::text,0));
  select c.* into result from public.sample_english_content c where c.resource=p_resource and c.record_id=p_record_id for update;
  if not found or result.version <> p_expected_version then raise exception 'Content changed concurrently' using errcode='40001'; end if;
  perform public.validate_sample_english_content(p_resource,result.draft);
  next_published := coalesce(result.published,'{}'::jsonb) - p_field;
  if coalesce(result.draft->>p_field,'') <> '' then next_published := next_published || pg_catalog.jsonb_build_object(p_field,result.draft->p_field); end if;
  update public.sample_english_content c set published=next_published,published_at=pg_catalog.clock_timestamp(),
    version=c.version+1,updated_at=pg_catalog.clock_timestamp(),updated_by=auth.uid()
    where c.resource=p_resource and c.record_id=p_record_id returning c.* into result;
  return result;
end $$;
revoke all on function public.publish_sample_english_photo(text,uuid,text,bigint) from public, anon, authenticated;
grant execute on function public.publish_sample_english_photo(text,uuid,text,bigint) to authenticated;
