-- Editorial English copy for currently published source records. Idempotent:
-- existing drafts/publications are never overwritten. Apply only after
-- 20260928110700_extend_english_profiles.sql.
begin;

with copy(section_key,title,content) as (values
  ('foundation','Our Founding','Seoul Motet Choir, rooted in Christian values and the ideals of church music, founded Seoul Motet Youth Choir in 2014 to mark its 25th anniversary and the establishment of Seoul Motet Music Foundation.'),
  ('education','Our Educational Purpose','Part of the Seoul Motet Music Foundation Youth Academy, the choir offers creative music education to young people. Its aim is to nurture musical ability, intellectual growth and character in the next generation.'),
  ('activities','Performance Activities','Since its first performance at the founding event of Seoul Motet Music Foundation, the choir has grown through annual concerts, community performances, invited appearances in Korea and Europe, and an EBS music documentary marking Liberation Day.'),
  ('mission','The Value of Music and Our Vision','When education is focused on examinations, opportunities to sing together can be scarce. The choir helps young people discover the meaning and value of music, share generosity and love with their neighbours, and bring Korean artistic excellence to audiences around the world.')
), source as (
  select s.id, jsonb_build_object('title',copy.title,'content',copy.content) fields
  from public.about_sections s join copy on copy.section_key=s.section_key
  where s.is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'about_sections',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with copy(year,source_title,title,content) as (values
  ('2014','서울모테트청소년합창단 창단','Founding of Seoul Motet Youth Choir','Founded on 28 June 2014.'),
  ('2015','제1회 정기연주회','First Annual Concert','28 November 2015 · Ceramic Palace Hall.'),
  ('2016','제2회 정기연주회','Second Annual Concert','26 November 2016 · IBK Hall, Seoul Arts Center.'),
  ('2017','종교개혁 500주년 특별정기연주회 협연','Reformation 500th Anniversary Concert','27 October 2017 · Joined Seoul Motet Choir for its 107th special concert at the Concert Hall, Seoul Arts Center.'),
  ('2017','제3회 정기연주회','Third Annual Concert','18 November 2017 · Youngsan Art Hall.'),
  ('2017','합창음악캠프 연주','Choral Music Camp Performance','8 August 2017 · Performed at the choral music camp organised by Handong Global University and Seoul Motet Music Foundation.'),
  ('2017','EBS 다큐프라임 출연','EBS Documentary Appearance','15 August 2017 · Appeared in an EBS documentary marking Liberation Day.'),
  ('2018','제4회 정기연주회','Fourth Annual Concert','29 November 2018 · Seoul Anglican Cathedral.'),
  ('2018','유럽 초청연주 및 비전투어','European Concerts and Vision Tour','31 July–9 August 2018 · Invited performances and a vision tour in Europe.'),
  ('2019','제5회 정기연주회','Fifth Annual Concert','31 August 2019 · Ceramic Palace Hall.'),
  ('2020','드라마 촬영 참여','Television Drama Filming','Participated in filming for the JTBC and Netflix drama All of Us Are Dead.'),
  ('2020','세일 한국 가곡의 밤 초청연주','Invited Korean Art Song Performance','Invited to perform at the 12th Seil Korean Art Song Night.'),
  ('2021','국제 합창 컨퍼런스 참여','International Choral Conference','Participated in the Grand Toa Cantat international choral conference in Japan.'),
  ('2022','서울모테트합창단 협연','Joint Concerts with Seoul Motet Choir','Joined Seoul Motet Choir for its 120th and 121st concerts at Lotte Concert Hall.'),
  ('2023','tvN 드라마 삽입곡 녹음','Recording for a tvN Drama','Recorded music for the tvN drama Castaway Diva.'),
  ('2024','제10주년 기념 정기연주회','10th Anniversary Concert','A concert marking the choir’s 10th anniversary at Doam Hall, Seoul Art Center.'),
  ('2025','2025년 유럽 초청연주','European Concerts in 2025','Invited performances and a vision trip in Europe in 2025.'),
  ('2025','제11회 정기연주회','11th Annual Concert','An annual concert marking the choir’s 11th anniversary at Ceramic Palace Hall.')
), source as (
  select h.id,jsonb_build_object('title',copy.title,'content',copy.content) fields
  from public.history h join copy on copy.year=h.year and copy.source_title=h.title
  where h.is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'history',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id, jsonb_build_object(
    'name','Kim Hyung-su',
    'role','Conductor',
    'description', E'Conductor Kim Hyung-su leads Seoul Motet Youth Choir, founded in 2014 alongside Seoul Motet Music Foundation. For 35 years he has been a member and principal associate conductor of the professional Seoul Motet Choir. He also teaches at the foundation\'s Youth Academy and Youth Choir.\n\nHe studied vocal music as an undergraduate and choral conducting at postgraduate level, followed by doctoral studies in church music at Midwest University. He completed an M.Div. in theology, served as a music pastor and taught at several universities.',
    'bio', E'Conductor, Seoul Motet Youth Choir\nExecutive director, Seoul Motet Music Foundation\nPrincipal associate conductor, Seoul Motet Choir\nConductor, Shalom Choir at the Lord\'s Church\nLecturer in music (conducting), Baekseok Arts Graduate School'
  ) fields from public.conductor where name='김형수' and is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'conductor',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with copy(source_name,role,bio) as (values
  ('박정화','Accompanist',E'Graduated from Kaywon Arts High School. Studied piano at Ewha Womans University and collaborative piano in its graduate programme. Earned a master\'s degree in collaborative piano at Mannes School of Music and was a Vocal Piano Fellow at Music Academy of the West.\n\nCurrently an accompanist for Seoul Motet Youth Choir and vocal programmes at Dankook and Myongji universities, and a member of Violtown.'),
  ('길주향','Principal Accompanist',E'Graduated from Seoul Arts High School. Graduated with highest honours in piano from Chung-Ang University and completed graduate studies in collaborative piano on a full scholarship.\n\nCurrently an accompanist for Seoul Motet Youth Choir and Seoul Junior Choir, and associate accompanist for Korea Male Chorus.')
), source as (
  select a.id,jsonb_build_object('role',copy.role,'bio',copy.bio) fields
  from public.accompanist a join copy on copy.source_name=a.name
  where a.is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'accompanist',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object(
    'title','Join Us',
    'description','We welcome new members to sing with Seoul Motet Youth Choir.',
    'target',E'Children\'s choir - Primary school years 2–5\nYouth choir - Primary year 6 and middle or high school students\nUniversity choir - University students aged 22 or under',
    'parts','Soprano, Alto, Tenor and Bass',
    'audition_process','Contact us to arrange an individual audition date.',
    'preparation','Prepare a song of your choice or the assigned piece.',
    'rehearsal_time','Saturdays, 10:00 AM–1:00 PM',
    'rehearsal_location','B1, Seoju Building, 17, Saimdang-ro 8-gil, Seocho-gu, Seoul'
  ) fields from public.join_info where is_visible is true and title='입단 안내'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'join_info',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object(
    'title','Support Pledge',
    'subtitle','I would like to support Seoul Motet Youth Choir.',
    'description','Your support helps sustain the choir’s rehearsals, performances and music education.',
    'message','Your gift helps the next generation grow in musicianship, character and faith. Join us in sustaining regular rehearsals, concerts, invited appearances and community performances.',
    'bank_note','Bank account details will appear after they are entered in the administrator CMS.',
    'form_note','Submit this form online, or print or save it as a PDF for your records.',
    'privacy_notice','Your personal information is used only to provide support information and confirm your pledge. It is available only to authorised administrators.',
    'print_note','You can print or save this form as a PDF. If submitted online, the same information is saved in the administrator CMS.',
    'submit_button_label','Submit pledge',
    'print_button_label','Print pledge',
    'success_message','Your pledge has been received. We will contact you after reviewing it.',
    'organization_name','Seoul Motet Youth Choir',
    'footer_note','Your information is stored securely in the administrator CMS and is not shown on the public website.'
  ) fields from public.support_settings where is_visible is true and title='후원약정'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'support_settings',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','12th Annual Concert','location','Ceramic Palace Hall') fields
  from public.concerts where is_visible is true and title='제 12회 정기연주회' and concert_date='2026-12-21'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'concerts',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with copy(source_question,question,answer) as (values
  ('입단 문의는 어디에서 하나요?','Where can I ask about joining?','You can ask through the Support & Contact page or the official contact details.'),
  ('연습 시간은 어디에서 확인하나요?','When are rehearsals?','Rehearsals take place on Saturdays from 10:00 AM to 1:00 PM.')
), source as (
  select f.id,jsonb_build_object('question',copy.question,'answer',copy.answer) fields
  from public.faq f join copy on copy.source_question=f.question where f.is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'faq',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','2026 Winter Retreat') fields
  from public.gallery where is_visible is true and title='2026 겨울수련회'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'gallery',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with copy(source_title,title,subtitle,description,image_alt,primary_cta_label,secondary_cta_label) as (values
  ('4',null,null,null,null,'View concert dates',null),
  ('서울모테트청소년합창단','Seoul Motet Youth Choir','Clear young voices, lasting resonance','Young voices bring the depth of classical choral music to the stage.','Seoul Motet Youth Choir in performance','View concerts','Join Us'),
  ('함께 배우고 함께 노래하는 시간','Learning and Singing Together','Growing in musicianship and character','Through regular rehearsals and performances, young singers discover the value of choral music and the joy of working together.','Seoul Motet Youth Choir in rehearsal','About the Choir','Join Us'),
  ('무대 위에서 이어지는 나눔','Sharing from the Stage','Annual, invited and community performances','Our performances share the beauty of choral music and a message of care with audiences.','Seoul Motet Youth Choir on stage','View gallery','Support & Contact')
), source as (
  select h.id,jsonb_strip_nulls(jsonb_build_object('title',copy.title,'subtitle',copy.subtitle,'description',copy.description,'image_alt',copy.image_alt,'primary_cta_label',copy.primary_cta_label,'secondary_cta_label',copy.secondary_cta_label)) fields
  from public.hero_slides h join copy on copy.source_title=h.title where h.is_visible is true
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'hero_slides',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','Website Information','content','Information about the Seoul Motet Youth Choir website.') fields
  from public.notices where is_visible is true and title='홈페이지 안내'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'notices',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','2026 Seoul Motet Youth Choir Recruitment','content','2026 Seoul Motet Youth Choir Recruitment') fields
  from public.popup_notices where is_visible is true and title='2026 서울모테트청소년합창단 단원 모집'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'popup_notices',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','2026 Seoul Motet Youth Choir Recruitment') fields
  from public.posters where is_visible is true and title in ('2026 서울모테트청소년합창단 단원 모집','2026년 서울모테트청소년합창단 단원모집')
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'posters',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

with source as (
  select id,jsonb_build_object('title','11th Annual Concert') fields
  from public.videos where is_visible is true and title='제 11회 정기연주회'
)
insert into public.sample_english_content(resource,record_id,draft,published,version,published_at)
select 'videos',id,fields,fields,1,now() from source
on conflict (resource,record_id) do nothing;

do $$ declare row record; begin
  for row in select resource,draft from public.sample_english_content where resource in ('about_sections','history','conductor','accompanist','join_info','support_settings','concerts','faq','gallery','hero_slides','notices','popup_notices','posters','videos') loop
    perform public.validate_sample_english_content(row.resource,row.draft);
  end loop;
end $$;

commit;
