-- Quotes from the currently published Spirit page (KO source version 145).
-- Only line breaks and excerpt boundaries change. Routes and style settings stay intact.
-- Expected versions prevent overwriting concurrent CMS edits; revisions retain both publications.
BEGIN;
DO $spirit_quotes$
DECLARE
  ko_changes jsonb := '{
  "home.scoreBook.cover.titleLines": "연습에서 삶으로\n이어지는 합창교육",
  "home.scoreBook.leftPage.titleLines": "청소년 합창교육\n공동체",
  "home.scoreBook.leftPage.body": "매주 정기 연습과 공연, 국내외 교류를 통해\n음악적 기량과 공동체성을 함께 배웁니다.",
  "home.scoreBook.leftPage.calloutTitle": "연습에서 삶으로",
  "home.scoreBook.rightPage.prefix": "하나의 울림",
  "home.scoreBook.rightPage.titleLines": "서로 다른 목소리가\n하나의 공동체가 됩니다.",
  "home.scoreBook.rightPage.body": "혼자 부르면 한 사람의 소리입니다.",
  "home.scoreBook.rightPage.keywords": "듣기 · 호흡 · 합창",
  "home.scoreBook.rightPage.calloutTitle": "함께 책임질 때",
  "home.scoreBook.final.titleLines": "서로 듣고 맞추면\n화음이 됩니다",
  "home.scoreBook.final.summary": "함께 책임질 때 공동체가 됩니다.",
  "home.scoreBook.final.primaryCtaLabel": "사진·영상 보기",
  "home.scoreBook.final.secondaryCtaLabel": "공연 일정 보기",
  "home.spiritWrapper.orbitHeadline": "시대를 잇는 정신,\n평화를 빚는 목소리.",
  "home.tablet.spiritWrapper.responsiveTitle": "시대를 잇는 정신,\n평화를 빚는 목소리.",
  "home.tablet.spiritWrapper.responsiveDescription": "시대를 넘어 이어져 온 음악의 가치를 배우고,\n새로운 세대의 목소리로 그 정신을 이어갑니다.",
  "home.tablet.scoreBook.responsiveTitle": "서로 듣고 맞추면\n화음이 됩니다.",
  "home.tablet.scoreBook.responsiveLeftBody": "매주 정기 연습과 공연, 국내외 교류를 통해\n음악적 기량과 공동체성을 함께 배웁니다.",
  "home.tablet.scoreBook.responsiveRightTitle": "듣기 · 호흡 · 합창",
  "home.tablet.scoreBook.responsiveRightBody": "혼자 부르면 한 사람의 소리입니다.\n서로 듣고 맞추면 화음이 됩니다.\n함께 책임질 때 공동체가 됩니다.",
  "home.mobile.spiritWrapper.responsiveTitle": "시대를 잇는 정신,\n평화를 빚는 목소리.",
  "home.mobile.spiritWrapper.responsiveDescription": "시대를 넘어 이어져 온 음악의 가치를 배우고,\n새로운 세대의 목소리로 그 정신을 이어갑니다.",
  "home.content.spirit.motet.title": "서울모테트음악재단과 청소년합창단",
  "home.content.spirit.motet.body": "모테트가 쌓아 온 음악적 경험과 교육철학을\n다음 세대와 나누고자 청소년합창단을 창단했습니다.\n청소년들이 음악을 배우고 함께 성장하는 길을 엽니다.",
  "home.content.spirit.honest-music.title": "청소년 합창교육 공동체",
  "home.content.spirit.honest-music.body": "매주 정기 연습과 공연, 국내외 교류를 통해\n음악적 기량과 공동체성을 함께 배웁니다.\n연습에서 익힌 태도를 무대와 일상에서 실천합니다.",
  "home.content.spirit.church-music.title": "교회음악의 깊이",
  "home.content.spirit.church-music.body": "작품에 충실한 연주와 교회음악의 깊이를 추구하며\n서울모테트합창단의 음악적 여정이 시작되었습니다.\n이 경험은 다음 세대를 위한 교육으로 이어집니다.",
  "home.content.spirit.community.title": "서로 다른 목소리가 하나의 공동체가 됩니다.",
  "home.content.spirit.community.body": "합창은 나의 목소리를 더 크게 내는 일이 아니라\n서로의 소리를 듣고 자신의 자리를 조율하며\n함께 하나의 음악을 만드는 공동체 예술입니다.",
  "home.content.spirit.next-generation.title": "다음 세대의 울림",
  "home.content.spirit.next-generation.body": "서로 다른 문화와 사람을 만나고 이해하며\n더 넓은 세계를 바라보는 시야를 키웁니다.\n음악으로 평화와 미래를 이야기하는 청소년으로 성장합니다.",
  "home.scoreBook.rightPage.calloutBody": "함께 책임질 때 공동체가 됩니다.",
  "home.scoreBook.leftPage.calloutBody": "연습에서 익힌 태도를 무대와 일상에서 실천합니다."
}'::jsonb;
  en_changes jsonb := '{
  "home.scoreBook.cover.titleLines": "Choral education,\nfrom rehearsal\nto everyday life",
  "home.scoreBook.leftPage.titleLines": "A community for\nyouth choral education",
  "home.scoreBook.leftPage.body": "Weekly rehearsals, performances and exchanges at home and abroad develop musicianship and a sense of community.",
  "home.scoreBook.leftPage.calloutTitle": "From rehearsal to everyday life",
  "home.scoreBook.rightPage.prefix": "One shared sound",
  "home.scoreBook.rightPage.titleLines": "Different voices,\none shared community.",
  "home.scoreBook.rightPage.body": "Alone, we hear one voice.",
  "home.scoreBook.rightPage.keywords": "Listening · Breath · Singing",
  "home.scoreBook.rightPage.calloutTitle": "Sharing responsibility",
  "home.scoreBook.final.titleLines": "Listening and finding balance\ncreates harmony",
  "home.scoreBook.final.summary": "Sharing responsibility makes a community.",
  "home.scoreBook.final.primaryCtaLabel": "View photos & videos",
  "home.scoreBook.final.secondaryCtaLabel": "View concert dates",
  "home.spiritWrapper.orbitHeadline": "A spirit across generations,\nvoices that shape peace.",
  "home.tablet.spiritWrapper.responsiveTitle": "A spirit across generations,\nvoices that shape peace.",
  "home.tablet.spiritWrapper.responsiveDescription": "We learn and carry forward a thoughtful approach to music and the values of community through weekly rehearsals and performances.",
  "home.tablet.scoreBook.responsiveTitle": "Listening and finding balance\ncreates harmony.",
  "home.tablet.scoreBook.responsiveLeftBody": "Weekly rehearsals, performances and exchanges at home and abroad develop musicianship and a sense of community.",
  "home.tablet.scoreBook.responsiveRightTitle": "Listening · Breath · Singing",
  "home.tablet.scoreBook.responsiveRightBody": "Alone, we hear one voice. Listening and finding balance creates harmony. Sharing responsibility makes a community.",
  "home.mobile.spiritWrapper.responsiveTitle": "A spirit across generations,\nvoices that shape peace.",
  "home.mobile.spiritWrapper.responsiveDescription": "We learn and carry forward a thoughtful approach to music and the values of community through weekly rehearsals and performances.",
  "home.content.spirit.motet.title": "Seoul Motet Music Foundation and Youth Choir",
  "home.content.spirit.motet.body": "The Youth Choir was founded to share Motet’s musical experience and educational philosophy with the next generation. It gives young people a place to learn music and grow together.",
  "home.content.spirit.honest-music.title": "A community for youth choral education",
  "home.content.spirit.honest-music.body": "Weekly rehearsals, performances and exchanges at home and abroad develop musicianship and a sense of community. What we learn in rehearsal carries into the stage and everyday life.",
  "home.content.spirit.church-music.title": "The depth of church music",
  "home.content.spirit.church-music.body": "Seoul Motet Choir began its musical journey with a commitment to faithful interpretations and the depth of church music. That experience continues through education for the next generation.",
  "home.content.spirit.community.title": "Different voices, one shared community.",
  "home.content.spirit.community.body": "Choral singing is not about making your own voice louder. It is a shared art: listening to others, finding your place and making one piece of music together.",
  "home.content.spirit.next-generation.title": "The next generation’s voices",
  "home.content.spirit.next-generation.body": "Meeting people from different cultures helps young singers understand others and see a wider world. They grow into young people who speak of peace and the future through music.",
  "home.scoreBook.rightPage.calloutBody": "Sharing responsibility makes a community.",
  "home.scoreBook.leftPage.calloutBody": "What we learn in rehearsal carries into the stage and everyday life."
}'::jsonb;
  ko_page public.site_editor_pages%rowtype;
  en_page public.sample_english_editor_pages%rowtype;
  ko_document jsonb;
  en_document jsonb;
  device_name text;
  field record;
  publication_time timestamptz := clock_timestamp();
BEGIN
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('site-editor:home',0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-editor:home',0));
  select * into strict ko_page from public.site_editor_pages where page_key='home' for update;
  select * into strict en_page from public.sample_english_editor_pages where page_key='home' for update;
  if ko_page.version <> 22 or en_page.version <> 1
     or ko_page.draft is distinct from ko_page.published or en_page.draft is distinct from en_page.published then
    raise exception 'Home versions or drafts changed; preserve the newer CMS work first.';
  end if;
  if not exists(select 1 from public.site_editor_pages where page_key='spirit' and version=145) then
    raise exception 'The source Spirit page changed; re-read its quotations first.';
  end if;
  ko_document := jsonb_set(ko_page.published,'{copy}',coalesce(ko_page.published->'copy','{}'::jsonb)||ko_changes);
  en_document := jsonb_set(en_page.published,'{copy}',coalesce(en_page.published->'copy','{}'::jsonb)||en_changes);
  foreach device_name in array array['desktop','tablet','mobile'] loop
    for field in select key,value from jsonb_each(ko_changes) loop
      if coalesce(ko_document #> array['deviceCopy',device_name],'{}'::jsonb) ? field.key then
        ko_document := jsonb_set(ko_document,array['deviceCopy',device_name,field.key],field.value);
      end if;
    end loop;
    for field in select key,value from jsonb_each(en_changes) loop
      if coalesce(en_document #> array['deviceCopy',device_name],'{}'::jsonb) ? field.key then
        en_document := jsonb_set(en_document,array['deviceCopy',device_name,field.key],field.value);
      end if;
    end loop;
  end loop;
  perform public.validate_site_editor_document(ko_document);
  perform public.validate_site_editor_document(en_document);
  if (ko_document - 'copy' - 'deviceCopy') is distinct from (ko_page.published - 'copy' - 'deviceCopy')
    or (en_document - 'copy' - 'deviceCopy') is distinct from (en_page.published - 'copy' - 'deviceCopy') then
    raise exception 'Non-copy settings changed unexpectedly.';
  end if;
  update public.site_editor_pages set draft=ko_document,published=ko_document,version=version+1,
    updated_at=publication_time,published_at=publication_time,updated_by=null where page_key='home';
  update public.sample_english_editor_pages set draft=en_document,published=en_document,version=version+1,
    updated_at=publication_time,published_at=publication_time,updated_by=null where page_key='home';
  insert into public.site_editor_revisions(page_key,document,published_at,published_by)
    values('home',ko_document,publication_time,null);
  insert into public.sample_english_editor_revisions(page_key,document,published_at,published_by)
    values('home',en_document,publication_time,null);
  update public.site_texts t set value=e.value,updated_at=publication_time,updated_by=null
    from jsonb_each_text(ko_changes) e where t.page='home' and t.key=e.key and t.value is distinct from e.value;
  if not exists(select 1 from public.site_editor_pages where page_key='home' and published->'copy' @> ko_changes and draft=published)
    or not exists(select 1 from public.sample_english_editor_pages where page_key='home' and published->'copy' @> en_changes and draft=published) then
    raise exception 'Quote publication verification failed.';
  end if;
END;
$spirit_quotes$;
COMMIT;
select 'Spirit quotations published' as result,
  (select version from public.site_editor_pages where page_key='home') as ko_version,
  (select version from public.sample_english_editor_pages where page_key='home') as en_version;

-- The cover uses an exact shorter excerpt so the existing type size fits.
BEGIN;
DO $quote_cover$
DECLARE
  ko_page public.site_editor_pages%rowtype;
  en_page public.sample_english_editor_pages%rowtype;
  ko_document jsonb;
  en_document jsonb;
  cover_key text := 'home.scoreBook.cover.titleLines';
  ko_cover text := E'연습에서\n삶으로';
  en_cover text := E'From rehearsal\nto everyday life';
  device_name text;
  publication_time timestamptz := clock_timestamp();
BEGIN
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('site-editor:home',0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sample-english-editor:home',0));
  select * into strict ko_page from public.site_editor_pages where page_key='home' for update;
  select * into strict en_page from public.sample_english_editor_pages where page_key='home' for update;
  if ko_page.version <> 23 or en_page.version <> 2
    or ko_page.draft is distinct from ko_page.published or en_page.draft is distinct from en_page.published then
    raise exception 'Home changed after quote publication; preserve the newer work first.';
  end if;
  ko_document := jsonb_set(ko_page.published,array['copy',cover_key],to_jsonb(ko_cover));
  en_document := jsonb_set(en_page.published,array['copy',cover_key],to_jsonb(en_cover));
  foreach device_name in array array['desktop','tablet','mobile'] loop
    if coalesce(ko_document#>array['deviceCopy',device_name],'{}'::jsonb) ? cover_key then
      ko_document:=jsonb_set(ko_document,array['deviceCopy',device_name,cover_key],to_jsonb(ko_cover));
    end if;
    if coalesce(en_document#>array['deviceCopy',device_name],'{}'::jsonb) ? cover_key then
      en_document:=jsonb_set(en_document,array['deviceCopy',device_name,cover_key],to_jsonb(en_cover));
    end if;
  end loop;
  perform public.validate_site_editor_document(ko_document);
  perform public.validate_site_editor_document(en_document);
  update public.site_editor_pages set draft=ko_document,published=ko_document,version=version+1,
    updated_at=publication_time,published_at=publication_time,updated_by=null where page_key='home';
  update public.sample_english_editor_pages set draft=en_document,published=en_document,version=version+1,
    updated_at=publication_time,published_at=publication_time,updated_by=null where page_key='home';
  insert into public.site_editor_revisions(page_key,document,published_at,published_by) values('home',ko_document,publication_time,null);
  insert into public.sample_english_editor_revisions(page_key,document,published_at,published_by) values('home',en_document,publication_time,null);
  update public.site_texts set value=ko_cover,updated_at=publication_time,updated_by=null where page='home' and key=cover_key;
END;
$quote_cover$;
COMMIT;
select 'Cover excerpt fitted without font changes' as result;
