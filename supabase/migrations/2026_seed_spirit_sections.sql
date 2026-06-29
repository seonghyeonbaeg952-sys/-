-- Adds CMS-editable copy blocks for the spirit/education pages.
-- Safe to run multiple times: existing section_key rows are preserved.

insert into public.about_sections (
  section_key,
  title,
  content,
  display_order,
  is_visible
)
values
  (
    'spirit_hero',
    '정직한 음악으로
다음 세대를 세웁니다',
    'cta_label: 합창단 정신 보기
cta_url: /spirit
secondary_cta_label: 입단 안내
secondary_cta_url: /join

서울모테트청소년합창단은 서울모테트합창단의 예술적·신앙적 전통을 바탕으로, 합창을 통해 지성·인성·영성·공동체성을 함께 배워가는 다음세대 음악교육 공동체입니다.',
    100,
    true
  ),
  (
    'spirit_manifesto',
    '합창은 소리를 맞추는 일을 넘어,
사람을 세우는 교육입니다.',
    '서울모테트청소년합창단의 정신은 더 크게 부르는 데 있지 않습니다. 더 정직하게 듣고, 더 깊이 해석하며, 함께 하나의 울림을 만들어 가는 데 있습니다.

우리는 합창을 통해 자신의 소리를 조율하고, 타인의 소리를 존중하며, 하나의 음악을 위해 함께 책임지는 법을 배웁니다.

음악은 단순한 기술이나 공연의 결과가 아니라, 말씀과 진리, 아름다움과 공동체를 삶 속에서 배우게 하는 교육의 통로입니다.

서울모테트청소년합창단은 서울모테트합창단이 오랜 시간 지켜 온 정직한 음악, 교회음악의 바른 이상, 작품 앞에서의 성실함, 공동체적 책임의 정신을 다음 세대의 언어로 이어갑니다.',
    105,
    true
  ),
  (
    'spirit_motet',
    '모테트라는 이름에는
정통 합창음악의 뿌리가 담겨 있습니다.',
    'quote: 우리는 오래된 전통을 보존하는 데 머무르지 않습니다. 그 전통을 오늘의 청소년이 배우고, 부르고, 삶으로 이어 가도록 돕습니다.

모테트는 중세와 르네상스 이후 발전해 온 다성음악 전통을 상징하는 말이며, 교회음악과 합창음악의 뿌리를 떠올리게 하는 이름입니다. 서울모테트의 이름은 단순한 명칭이 아니라, 순수 합창음악과 교회음악의 전통을 연구하고 계승하며 다음 세대에 전하고자 하는 사명을 담고 있습니다.',
    110,
    true
  ),
  (
    'spirit_education',
    '합창은 소리를 맞추는 일을 넘어,
사람을 세우는 교육입니다.',
    '서울모테트청소년합창단의 정신은 더 크게 부르는 데 있지 않습니다. 더 정직하게 듣고, 더 깊이 해석하며, 함께 하나의 울림을 만들어 가는 데 있습니다.

우리는 합창을 통해 자신의 소리를 조율하고, 타인의 소리를 존중하며, 하나의 음악을 위해 함께 책임지는 법을 배웁니다.',
    120,
    true
  ),
  (
    'spirit_peace',
    '노래는 다음 세대의 기억이 됩니다.',
    '서울모테트청소년합창단은 합창을 통해 음악적 재능만이 아니라, 신앙의 기억과 공동체적 책임, 삶의 방향을 다음 세대 안에 심는 일을 사명으로 삼습니다.',
    130,
    true
  ),
  (
    'spirit_cta',
    '함께 부르는 다음 세대의 울림에 동참하세요.',
    'cta_label: 입단 안내
cta_url: /join
secondary_cta_label: 후원 참여
secondary_cta_url: /contact?section=support

입단은 청소년에게 성장의 자리가 되고, 후원은 그 성장을 가능하게 하는 동행이 됩니다.',
    140,
    true
  ),
  (
    'home_spirit',
    '합창으로 배우는 것',
    'cta_label: 합창단 정신 자세히 보기
cta_url: /spirit
eyebrow: What We Learn in Choir

우리는 음정을 맞추는 법만 배우지 않습니다. 서로를 듣는 법, 함께 기다리는 법, 하나의 울림을 위해 자신을 조율하는 법을 배웁니다.

그 과정에서 음악은 기술을 넘어 인성과 신앙, 공동체성과 미래 비전을 세우는 교육의 자리가 됩니다.',
    150,
    true
  )
on conflict (section_key) do nothing;
