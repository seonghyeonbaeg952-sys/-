import type { FAQItem } from '../types/content'

export const defaultJoinFaqs: FAQItem[] = [
  {
    id: 'default-join-faq-1',
    question: '합창 경험이 없어도 지원할 수 있나요?',
    answer:
      '네. 합창 경험만으로 지원 여부를 판단하지 않습니다. 기본적인 음정과 리듬, 노래를 배우려는 태도, 정기 연습에 참여할 수 있는지를 함께 확인합니다.',
    category: 'join',
    display_order: 1,
    is_visible: true,
  },
  {
    id: 'default-join-faq-2',
    question: '지원할 파트를 잘 모르겠어요.',
    answer:
      '지원서에서 “잘 모르겠습니다”를 선택해도 됩니다. 입단 과정에서 편안하게 낼 수 있는 음역을 확인한 뒤 알맞은 파트를 안내합니다.',
    category: 'join',
    display_order: 2,
    is_visible: true,
  },
  {
    id: 'default-join-faq-3',
    question: '입단 절차는 어떻게 진행되나요?',
    answer:
      '입단지원서를 제출하면 담당자가 내용을 확인한 뒤 보호자 연락처로 안내합니다. 이후 간단한 음역·리듬 확인과 상담을 거쳐 결과와 다음 일정을 안내합니다.',
    category: 'join',
    display_order: 3,
    is_visible: true,
  },
  {
    id: 'default-join-faq-4',
    question: '오디션 전에 무엇을 준비해야 하나요?',
    answer:
      '지원서 접수 후 필요한 준비 내용과 일정을 개별적으로 안내합니다. 별도 준비곡이나 서류가 필요한 경우에도 담당자가 미리 알려드립니다.',
    category: 'join',
    display_order: 4,
    is_visible: true,
  },
  {
    id: 'default-join-faq-5',
    question: '연습과 공연 일정은 어떻게 확인하나요?',
    answer:
      '정기 연습 시간은 입단 안내의 연습 섹션에서 확인할 수 있습니다. 공연과 특별 연습 일정은 확정되는 대로 단원과 보호자에게 안내합니다.',
    category: 'join',
    display_order: 5,
    is_visible: true,
  },
  {
    id: 'default-join-faq-6',
    question: '학교 시험이나 개인 일정이 있을 때는 어떻게 하나요?',
    answer:
      '정기적인 참여가 중요하지만 학교 시험이나 불가피한 일정이 있다면 미리 공유해 주세요. 출결과 일정 조정이 필요한 경우 담당자와 상의할 수 있습니다.',
    category: 'join',
    display_order: 6,
    is_visible: true,
  },
  {
    id: 'default-join-faq-7',
    question: '활동에 필요한 비용은 언제 안내받나요?',
    answer:
      '활동비와 공연·캠프 등 일정에 따른 비용은 입단 상담 과정에서 정확히 안내합니다. 확정되지 않은 금액을 먼저 요청하지 않습니다.',
    category: 'join',
    display_order: 7,
    is_visible: true,
  },
  {
    id: 'default-join-faq-8',
    question: '보호자 안내와 개인정보는 어떻게 관리되나요?',
    answer:
      '입단 과정과 주요 일정은 지원서에 입력한 보호자 연락처로 안내합니다. 제출한 개인정보와 사진은 입단 검토와 연락을 위해서만 사용하며 공개 명단이나 홈페이지에 임의로 게시하지 않습니다.',
    category: 'join',
    display_order: 8,
    is_visible: true,
  },
]

const faqTopicPatterns: Record<string, RegExp[]> = {
  'default-join-faq-1': [/합창.*경험/, /경험.*지원/],
  'default-join-faq-2': [/지원.*파트/, /음역/],
  'default-join-faq-3': [/입단.*절차/, /지원.*절차/],
  'default-join-faq-4': [/오디션.*준비/, /준비.*오디션/],
  'default-join-faq-5': [/연습.*시간/, /연습.*일정/, /공연.*일정/],
  'default-join-faq-6': [/학교/, /시험/],
  'default-join-faq-7': [/비용/, /활동비/],
  'default-join-faq-8': [/개인정보/, /보호자.*안내/],
}

export function mergeJoinFaqs(cmsFaqs: FAQItem[]) {
  if (cmsFaqs.length === 0) {
    return defaultJoinFaqs
  }

  const cmsQuestions = cmsFaqs.map((faq) => faq.question.replace(/\s+/g, ' ').trim())
  const supplementalFaqs = defaultJoinFaqs.filter((faq) => {
    const patterns = faqTopicPatterns[faq.id] ?? []

    return !cmsQuestions.some((question) =>
      patterns.some((pattern) => pattern.test(question)),
    )
  })

  return [...cmsFaqs, ...supplementalFaqs].map((faq, index) => ({
    ...faq,
    display_order: index + 1,
  }))
}
