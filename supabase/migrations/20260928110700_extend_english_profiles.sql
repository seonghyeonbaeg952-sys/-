begin;

-- English display fields are attached to the same public profile UUIDs.
-- Names for members remain shared to preserve their publication preferences.
alter table public.sample_english_content drop constraint sample_english_content_resource_check;
alter table public.sample_english_content add constraint sample_english_content_resource_check
  check (resource in (
    'notices','gallery','concerts','videos','posters','hero_slides',
    'popup_notices','history','faq','about_sections','sponsors',
    'site_settings','locations','join_info','support_settings',
    'conductor','accompanist','members'
  ));

create or replace function public.validate_sample_english_content(p_resource text, p_fields jsonb)
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
    when 'conductor' then array['name','role','description','bio','message','profile_image_alt','profile_summary','profile_highlight','hero_quote','current_roles','education_items','career_items','awards_items','activities_items','philosophy_title','philosophy_body','philosophy_quote','teaching_principles','message_title','message_body']
    when 'accompanist' then array['name','role','description','bio','message']
    when 'members' then array['description']
    when 'sponsors' then array['name','display_name','description','logo_url']
    when 'site_settings' then array['site_title','about_summary','address']
    when 'locations' then array['place_name','address','transit_info','parking_info','image_alt','image_caption','image_url']
    when 'join_info' then array['title','description','target','parts','audition_process','preparation','rehearsal_time','rehearsal_location']
    when 'support_settings' then array['title','subtitle','description','message','bank_note','form_note','privacy_notice','print_note','submit_button_label','print_button_label','success_message','organization_name','footer_note']
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

create or replace function public.sample_english_content_source_exists(p_resource text, p_record_id uuid, p_visible_only boolean)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare result boolean;
begin
  if p_resource is null or p_resource not in (
    'notices','gallery','concerts','videos','posters','hero_slides',
    'popup_notices','history','faq','about_sections','sponsors',
    'site_settings','locations','join_info','support_settings',
    'conductor','accompanist','members'
  ) then return false; end if;
  execute pg_catalog.format('select exists(select 1 from public.%I where id=$1 and (not $2 or is_visible is true))', p_resource)
    into result using p_record_id, p_visible_only;
  return result;
end;
$$;

commit;
