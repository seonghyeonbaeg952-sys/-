-- Seed practical join FAQs without replacing entries already managed in the CMS.
insert into public.faq (question, answer, category, display_order, is_visible)
select seed.question, seed.answer, 'join', seed.display_order, true
from (
  values
    (1, '합창 경험이 없어도 지원할 수 있나요?', '네. 합창 경험만으로 지원 여부를 판단하지 않습니다. 기본적인 음정과 리듬, 노래를 배우려는 태도, 정기 연습에 참여할 수 있는지를 함께 확인합니다.'),
    (2, '지원할 파트를 잘 모르겠어요.', '지원서에서 “잘 모르겠습니다”를 선택해도 됩니다. 입단 과정에서 편안하게 낼 수 있는 음역을 확인한 뒤 알맞은 파트를 안내합니다.'),
    (3, '입단 절차는 어떻게 진행되나요?', '입단지원서를 제출하면 담당자가 내용을 확인한 뒤 보호자 연락처로 안내합니다. 이후 간단한 음역·리듬 확인과 상담을 거쳐 결과와 다음 일정을 안내합니다.'),
    (4, '오디션 전에 무엇을 준비해야 하나요?', '지원서 접수 후 필요한 준비 내용과 일정을 개별적으로 안내합니다. 별도 준비곡이나 서류가 필요한 경우에도 담당자가 미리 알려드립니다.'),
    (6, '학교 시험이나 개인 일정이 있을 때는 어떻게 하나요?', '정기적인 참여가 중요하지만 학교 시험이나 불가피한 일정이 있다면 미리 공유해 주세요. 출결과 일정 조정이 필요한 경우 담당자와 상의할 수 있습니다.'),
    (7, '활동에 필요한 비용은 언제 안내받나요?', '활동비와 공연·캠프 등 일정에 따른 비용은 입단 상담 과정에서 정확히 안내합니다. 확정되지 않은 금액을 먼저 요청하지 않습니다.'),
    (8, '보호자 안내와 개인정보는 어떻게 관리되나요?', '입단 과정과 주요 일정은 지원서에 입력한 보호자 연락처로 안내합니다. 제출한 개인정보와 사진은 입단 검토와 연락을 위해서만 사용하며 공개 명단이나 홈페이지에 임의로 게시하지 않습니다.')
) as seed(display_order, question, answer)
where not exists (
  select 1
  from public.faq existing
  where existing.category = 'join'
    and lower(btrim(existing.question)) = lower(btrim(seed.question))
);
