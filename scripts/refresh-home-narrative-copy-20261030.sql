-- One-off editorial update for the requested home Spirit and score scenes.
-- Expected KO version 21; refuses to replace any unsaved/concurrent CMS work.
-- Previous publication is retained in CMS revisions. Non-copy settings are preserved.
BEGIN;
DO $home_copy$
DECLARE
  ko_changes jsonb := '{
  "home.scoreBook.cover.titleLines": "연습실에서\n무대까지",
  "home.scoreBook.leftPage.titleLines": "음정과 박자를 맞추고,\n가사의 뜻을 살핍니다",
  "home.scoreBook.leftPage.body": "발성과 악보 읽기부터 파트 연습까지,\n한 곡을 차근차근 익힙니다.",
  "home.scoreBook.leftPage.calloutTitle": "한 곡을 익히는 시간",
  "home.scoreBook.rightPage.prefix": "함께 맞추는 연습",
  "home.scoreBook.rightPage.titleLines": "다른 파트의 소리를\n들으며 함께 부릅니다",
  "home.scoreBook.rightPage.body": "내 파트를 부르며 다른 성부도 듣습니다.\n함께 연습한 곡으로 무대에 섭니다.",
  "home.scoreBook.rightPage.keywords": "듣기 · 호흡 · 합창",
  "home.scoreBook.rightPage.calloutTitle": "함께 준비한 무대",
  "home.scoreBook.final.titleLines": "한 곡을 함께 연습하고\n그 노래로 무대에 섭니다",
  "home.scoreBook.final.summary": "공연과 교류 현장의 모습을\n사진과 영상으로 만나보세요.",
  "home.scoreBook.final.primaryCtaLabel": "사진·영상 보기",
  "home.scoreBook.final.secondaryCtaLabel": "공연 일정 보기",
  "home.spiritWrapper.orbitHeadline": "작품의 뜻을 살피고,\n서로의 소리를 들으며\n함께 노래합니다.",
  "home.tablet.spiritWrapper.responsiveTitle": "작품의 뜻을 살피고,\n서로의 소리를 들으며\n함께 노래합니다.",
  "home.tablet.spiritWrapper.responsiveDescription": "음표와 가사를 읽고, 호흡을 맞춥니다.\n매주 연습에서 함께 부르는 법을 배웁니다.",
  "home.tablet.scoreBook.responsiveTitle": "한 곡을 함께 연습하고\n그 노래로 무대에 섭니다",
  "home.tablet.scoreBook.responsiveLeftBody": "발성과 악보 읽기부터 파트 연습까지,\n한 곡을 차근차근 익힙니다.",
  "home.tablet.scoreBook.responsiveRightTitle": "듣기 · 호흡 · 합창",
  "home.tablet.scoreBook.responsiveRightBody": "내 파트를 부르며 다른 성부도 듣습니다.\n함께 연습한 곡으로 무대에 섭니다.",
  "home.mobile.spiritWrapper.responsiveTitle": "작품의 뜻을 살피고,\n서로의 소리를 들으며\n함께 노래합니다.",
  "home.mobile.spiritWrapper.responsiveDescription": "음표와 가사를 읽고, 호흡을 맞춥니다.\n매주 연습에서 함께 부르는 법을 배웁니다.",
  "home.content.spirit.motet.title": "합창과 교회음악의 전통을 배웁니다.",
  "home.content.spirit.motet.body": "서울모테트가 이어 온 합창과 교회음악을 배웁니다.\n작품을 이해하고 함께 부르는 경험을\n청소년들과 나눕니다.",
  "home.content.spirit.honest-music.title": "음표와 가사의 뜻부터 살핍니다.",
  "home.content.spirit.honest-music.body": "음정과 박자를 맞추고, 가사가 전하는 뜻을 생각합니다.\n작곡가가 악보에 담은 것을 놓치지 않도록\n반복해서 듣고 연습합니다.",
  "home.content.spirit.church-music.title": "찬송의 말을 생각하며 부릅니다.",
  "home.content.spirit.church-music.body": "교회음악에 담긴 말씀과 신앙을 배웁니다.\n찬송의 가사를 읽고 뜻을 생각하며,\n노래를 통해 신앙을 돌아봅니다.",
  "home.content.spirit.community.title": "내 파트를 부르며 다른 파트도 듣습니다.",
  "home.content.spirit.community.body": "옆 사람의 호흡과 다른 성부의 선율을 듣습니다.\n내 소리가 어우러지도록 맞추며\n서로 배려하고 맡은 파트를 책임집니다.",
  "home.content.spirit.next-generation.title": "연습실에서 배운 것을 무대에서 나눕니다.",
  "home.content.spirit.next-generation.body": "매주 연습한 곡으로 무대에 서고,\n국내외 교류를 통해 다른 문화와 사람을 만납니다.\n함께 노래하며 음악을 보는 시야를 넓힙니다."
}'::jsonb;
  en_changes jsonb := '{
  "home.scoreBook.cover.titleLines": "From rehearsal\nto the stage",
  "home.scoreBook.leftPage.titleLines": "We learn the notes\nand the words",
  "home.scoreBook.leftPage.body": "We work on vocal technique, read the score and practise our parts, learning each piece step by step.",
  "home.scoreBook.leftPage.calloutTitle": "Learning a piece",
  "home.scoreBook.rightPage.prefix": "Rehearsing together",
  "home.scoreBook.rightPage.titleLines": "We sing our parts\nand listen to the others",
  "home.scoreBook.rightPage.body": "We sing our own parts while listening to the other voices, then take the music we have rehearsed onto the stage.",
  "home.scoreBook.rightPage.keywords": "Listening · Breath · Singing",
  "home.scoreBook.rightPage.calloutTitle": "Taking the stage together",
  "home.scoreBook.final.titleLines": "We rehearse each piece,\nthen sing it on stage",
  "home.scoreBook.final.summary": "See our performances and exchanges in photos and videos.",
  "home.scoreBook.final.primaryCtaLabel": "View photos & videos",
  "home.scoreBook.final.secondaryCtaLabel": "View concert dates",
  "home.spiritWrapper.orbitHeadline": "We study the music,\nlisten to each other\nand sing together.",
  "home.tablet.spiritWrapper.responsiveTitle": "We study the music,\nlisten to each other\nand sing together.",
  "home.tablet.spiritWrapper.responsiveDescription": "We read the notes and words, and learn to breathe together. Each week, we practise singing as a choir.",
  "home.tablet.scoreBook.responsiveTitle": "We rehearse each piece,\nthen sing it on stage",
  "home.tablet.scoreBook.responsiveLeftBody": "We work on vocal technique, read the score and practise our parts, learning each piece step by step.",
  "home.tablet.scoreBook.responsiveRightTitle": "Listening · Breath · Singing",
  "home.tablet.scoreBook.responsiveRightBody": "We sing our own parts while listening to the other voices, then take the music we have rehearsed onto the stage.",
  "home.mobile.spiritWrapper.responsiveTitle": "We study the music,\nlisten to each other\nand sing together.",
  "home.mobile.spiritWrapper.responsiveDescription": "We read the notes and words, and learn to breathe together. Each week, we practise singing as a choir.",
  "home.content.spirit.motet.title": "We learn from Motet’s choral tradition.",
  "home.content.spirit.motet.body": "Young singers learn from Seoul Motet’s experience in choral and church music, studying each work and singing it together.",
  "home.content.spirit.honest-music.title": "We begin with the notes and words.",
  "home.content.spirit.honest-music.body": "We work on pitch and rhythm, and consider what the words mean. Listening and rehearsing help us understand what the composer put on the page.",
  "home.content.spirit.church-music.title": "We think about the words we sing.",
  "home.content.spirit.church-music.body": "We explore the scripture and faith found in church music. Reading and singing the words of hymns gives us time to reflect on our faith.",
  "home.content.spirit.community.title": "We sing our part and listen to the others.",
  "home.content.spirit.community.body": "We listen to the breath of the singer beside us and the melodies in other parts. We adjust our voices, look out for one another and take responsibility for our own part.",
  "home.content.spirit.next-generation.title": "We take what we learn onto the stage.",
  "home.content.spirit.next-generation.body": "We perform the pieces we rehearse each week and meet people through exchanges at home and abroad. Singing together broadens how we hear and understand music."
}'::jsonb;
  current_page public.site_editor_pages%rowtype;
  next_document jsonb;
  en_document jsonb;
  device_name text;
  field record;
  publication_time timestamptz := clock_timestamp();
BEGIN
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('site-editor:home',0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-editor:home',0));
  select * into strict current_page from public.site_editor_pages where page_key='home' for update;
  if current_page.version <> 21 or current_page.draft is distinct from current_page.published then
    raise exception 'Home version or draft changed; re-read and preserve the newer CMS work.';
  end if;
  if exists (select 1 from public.sample_english_editor_pages where page_key='home') then
    raise exception 'English home document now exists; re-read and merge its content first.';
  end if;

  next_document := jsonb_set(current_page.published,'{copy}',coalesce(current_page.published->'copy','{}'::jsonb)||ko_changes);
  foreach device_name in array array['desktop','tablet','mobile'] loop
    for field in select key,value from jsonb_each(ko_changes) loop
      if coalesce(next_document #> array['deviceCopy',device_name],'{}'::jsonb) ? field.key then
        next_document := jsonb_set(next_document,array['deviceCopy',device_name,field.key],field.value);
      end if;
    end loop;
  end loop;
  en_document := jsonb_build_object('schemaVersion',1,'copy',en_changes,'deviceCopy','{}'::jsonb,'appearance','{}'::jsonb);
  perform public.validate_site_editor_document(next_document);
  perform public.validate_site_editor_document(en_document);
  if (next_document - 'copy' - 'deviceCopy') is distinct from (current_page.published - 'copy' - 'deviceCopy') then
    raise exception 'Non-copy editor settings changed unexpectedly.';
  end if;

  insert into public.site_editor_revisions(page_key,document,published_at,published_by)
    select 'home',current_page.published,current_page.published_at,null
    where not exists (select 1 from public.site_editor_revisions where page_key='home' and document=current_page.published);
  update public.site_editor_pages set
    draft=next_document,published=next_document,version=version+1,
    updated_at=publication_time,published_at=publication_time,updated_by=null
    where page_key='home';
  insert into public.site_editor_revisions(page_key,document,published_at,published_by)
    values ('home',next_document,publication_time,null);
  insert into public.sample_english_editor_pages(page_key,draft,published,version,updated_at,published_at,updated_by)
    values ('home',en_document,en_document,1,publication_time,publication_time,null);
  insert into public.sample_english_editor_revisions(page_key,document,published_at,published_by)
    values ('home',en_document,publication_time,null);
  update public.site_texts t set value=e.value,updated_at=publication_time,updated_by=null
    from jsonb_each_text(ko_changes) e where t.page='home' and t.key=e.key and t.value is distinct from e.value;

  if not exists (select 1 from public.site_editor_pages where page_key='home' and published->'copy' @> ko_changes and draft=published) then
    raise exception 'Korean publication verification failed.';
  end if;
  if not exists (select 1 from public.sample_english_editor_pages where page_key='home' and published->'copy' @> en_changes and draft=published) then
    raise exception 'English publication verification failed.';
  end if;
END;
$home_copy$;
COMMIT;
select 'Home narrative published' as result,
  (select version from public.site_editor_pages where page_key='home') as ko_version,
  (select version from public.sample_english_editor_pages where page_key='home') as en_version;
