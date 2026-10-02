-- Remove the old portrait-tablet CTA fragment translation after flow-based wrapping.
-- The desktop design and all copy stay unchanged; revision 66 remains recoverable.
do $cta$
declare r public.site_editor_pages%rowtype; next jsonb; stamp timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended('site-editor:spirit',0));
 select * into r from public.site_editor_pages where page_key='spirit' for update;
 if not found or r.version<>66 or r.draft is distinct from r.published or r.draft#>'{textLayouts,tablet,spirit.content.cta.body}' is distinct from '{"offsetX":9.7,"offsetY":20.7}'::jsonb then raise exception 'Spirit changed; CTA correction refused'; end if;
 next:=r.draft#-'{textLayouts,tablet,spirit.content.cta.body}';
 perform public.validate_site_editor_document(next);
 stamp:=clock_timestamp();
 update public.site_editor_pages set draft=next,published=next,version=version+2,updated_at=stamp,published_at=stamp,updated_by=null where page_key='spirit';
 insert into public.site_editor_revisions(page_key,document,published_at,published_by) values('spirit',next,stamp,null);
end;
$cta$;
select page_key,version,draft=published as equal from public.site_editor_pages where page_key='spirit';

