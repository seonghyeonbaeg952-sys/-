-- User selected RESIDENT ACCOMPANIST for this profile, both languages/all devices.
-- Changes only the profile-specific role eyebrow. No other staff role, photo, name or biography changes.
do $role_ko$
declare p jsonb := $role_payload_ko${"version":2,"draft":{"copy":{},"appearance":{},"deviceCopy":{"desktop":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"PRINCIPAL ACCOMPANIST"}},"schemaVersion":1},"published":{"copy":{},"appearance":{},"deviceCopy":{"desktop":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"PRINCIPAL ACCOMPANIST"}},"schemaVersion":1},"next":{"copy":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"appearance":{},"deviceCopy":{"desktop":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"mobile":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"tablet":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"}},"schemaVersion":1}}$role_payload_ko$::jsonb; r public.site_editor_pages%rowtype; stamp timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended('site-editor:accompanist',0));
 select * into r from public.site_editor_pages where page_key='accompanist' for update;
 if not found or r.version<>(p->>'version')::bigint or r.draft is distinct from p->'draft' or r.published is distinct from p->'published' then raise exception 'Accompanist ko changed; update refused'; end if;
 perform public.validate_site_editor_document(p->'next');
 if ((p->'next') - 'copy' - 'deviceCopy') is distinct from (r.draft - 'copy' - 'deviceCopy') then raise exception 'Unrelated profile settings changed'; end if;
 if not exists(select 1 from public.site_editor_revisions where page_key='accompanist' and document=r.published) then
 insert into public.site_editor_revisions(page_key,document,published_at,published_by) values('accompanist',r.published,r.published_at,null); end if;
 stamp:=clock_timestamp();
 update public.site_editor_pages set draft=p->'next',published=p->'next',version=version+2,updated_at=stamp,published_at=stamp,updated_by=null where page_key='accompanist';
 insert into public.site_editor_revisions(page_key,document,published_at,published_by) values('accompanist',p->'next',stamp,null);
end;
$role_ko$;
do $role_en$
declare p jsonb := $role_payload_en${"version":4,"draft":{"copy":{},"appearance":{},"deviceCopy":{"tablet":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"PRINCIPAL ACCOMPANIST"}},"textLayouts":{"tablet":{"accompanist.accompanistProfiles.english2":{"offsetX":-5.6,"offsetY":-18.4},"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":{"offsetX":-6.4,"offsetY":1.6}}},"schemaVersion":1},"published":{"copy":{},"appearance":{},"deviceCopy":{"tablet":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"PRINCIPAL ACCOMPANIST"}},"textLayouts":{"tablet":{"accompanist.accompanistProfiles.english2":{"offsetX":-5.6,"offsetY":-18.4},"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":{"offsetX":-6.4,"offsetY":1.6}}},"schemaVersion":1},"next":{"copy":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"appearance":{},"deviceCopy":{"tablet":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"mobile":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"},"desktop":{"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":"RESIDENT ACCOMPANIST"}},"textLayouts":{"tablet":{"accompanist.accompanistProfiles.english2":{"offsetX":-5.6,"offsetY":-18.4},"accompanist.profile.c465ce1e-1078-4de1-b39e-00e703be0446.role":{"offsetX":-6.4,"offsetY":1.6}}},"schemaVersion":1}}$role_payload_en$::jsonb; r public.sample_english_editor_pages%rowtype; stamp timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended('sample-english-editor:accompanist',0));
 select * into r from public.sample_english_editor_pages where page_key='accompanist' for update;
 if not found or r.version<>(p->>'version')::bigint or r.draft is distinct from p->'draft' or r.published is distinct from p->'published' then raise exception 'Accompanist en changed; update refused'; end if;
 perform public.validate_site_editor_document(p->'next');
 if ((p->'next') - 'copy' - 'deviceCopy') is distinct from (r.draft - 'copy' - 'deviceCopy') then raise exception 'Unrelated profile settings changed'; end if;
 if not exists(select 1 from public.sample_english_editor_revisions where page_key='accompanist' and document=r.published) then
 insert into public.sample_english_editor_revisions(page_key,document,published_at,published_by) values('accompanist',r.published,r.published_at,null); end if;
 stamp:=clock_timestamp();
 update public.sample_english_editor_pages set draft=p->'next',published=p->'next',version=version+2,updated_at=stamp,published_at=stamp,updated_by=null where page_key='accompanist';
 insert into public.sample_english_editor_revisions(page_key,document,published_at,published_by) values('accompanist',p->'next',stamp,null);
end;
$role_en$;
select 'ko' as language,page_key,version,draft=published as equal from public.site_editor_pages where page_key='accompanist' union all select 'en',page_key,version,draft=published from public.sample_english_editor_pages where page_key='accompanist';

