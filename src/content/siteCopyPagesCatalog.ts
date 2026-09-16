import type { EditorPageId, SiteCopyDefinition } from '../types/siteEditor'

export const pageCopyDefaults = {
  notices: {
    title: '공지사항', description: '입단 안내부터 공연 소식까지,\n서울모테트청소년합창단의 공식 소식을 전합니다.',
    all: '전체', important: '중요 공지', search: '검색', searchPlaceholder: '공지 제목 또는 내용 검색',
    category: '공지 분류', loading: '공지사항을 불러오는 중입니다', error: '공지사항을 불러오지 못했습니다',
    retry: '다시 시도', connection: '연결 상태를 확인한 뒤 다시 시도해 주세요.',
    noResults: '조건에 맞는 공지가 없습니다.', empty: '등록된 공지사항이 없습니다.',
    noResultsHelp: '분류를 바꾸거나 전체 공지를 확인해 주세요.', emptyHelp: '새로운 소식이 등록되면 이곳에서 안내합니다.', allAction: '전체 공지 보기',
  },
  'notice-detail': {
    title: '공지 상세', list: '공지사항', loading: '공지 상세를 불러오는 중입니다', error: '공지를 불러오지 못했습니다',
    connection: '연결 상태를 확인한 뒤 다시 시도해 주세요.', retry: '다시 시도', missing: '공지사항을 찾을 수 없습니다',
    missingHelp: '공개된 공지 목록에서 다른 소식을 확인해 주세요.', imageError: '이미지를 불러오지 못했습니다.', imageRetry: '이미지 다시 보기',
    bodyEmpty: '등록된 본문이 없습니다.', back: '목록으로 돌아가기',
  },
  concerts: {
    title: '공연 일정과 지난 기록을\n한눈에 확인합니다.', description: '공연 날짜, 시간, 장소와 신청·예매 여부를 확인하세요.',
    schedule: '공연 일정', notices: '공지사항', find: '공연 찾기', search: '공연명·장소 검색', reset: '초기화',
    dateFilter: '날짜 선택', categoryFilter: '공연 유형', emptyStage: '새로운 공연 소식을 준비하고 있습니다.', detail: '공연 상세',
    loading: '공연 목록을 불러오는 중입니다', retry: '다시 불러오기', error: '공연 목록을 불러오지 못했습니다', errorHelp: '공연 정보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
    upcoming: '다가오는 공연', archive: '지난 공연 기록', noUpcoming: '조건에 맞는 예정 공연이 없습니다', noUpcomingHelp: '검색어나 날짜·유형 필터를 조정해 보세요.',
    noArchive: '지난 공연 기록이 없습니다', noArchiveHelp: '공개된 지난 공연이 등록되면 이곳에 표시됩니다.',
    filterTitle: '공연 필터', close: '닫기', filterDate: '날짜', showResults: '개 공연 보기',
  },
  'concert-detail': {
    ticket: '예매하기', apply: '신청하기', list: '공연 목록으로', inquiry: '공연 문의', introduction: '공연 소개',
    program: '프로그램', performers: '출연', back: '공연·소식', loading: '공연 상세를 불러오는 중입니다', retry: '다시 불러오기', missing: '공연 정보를 찾을 수 없습니다',
  },
  gallery: {
    title: '갤러리', description: '공연과 연습, 함께한 순간들을\n사진과 영상으로 만나보세요.',
    photos: '사진', videos: '영상', posters: '포스터', category: '사진 분류', photoHint: '사진을 눌러 확대',
    videoHint: '영상을 눌러 재생', posterHint: '포스터를 눌러 확대', partialError: '일부 자료를 불러오지 못했습니다. 불러온 자료는 계속 볼 수 있습니다.',
    retry: '다시 시도', videoError: '영상 링크를 확인할 수 없습니다.', missing: '선택한 자료가 없거나 현재 공개되지 않았습니다.', back: '목록으로 돌아가기',
    loading: '갤러리를 불러오는 중입니다', allPhotos: '전체 사진 보기', noCategory: '선택한 분류의 사진이 없습니다', noCategoryHelp: '다른 분류를 선택하거나 전체 사진을 확인해 주세요.',
    noPhotos: '등록된 사진이 없습니다', noVideos: '등록된 영상이 없습니다', noPosters: '등록된 포스터가 없습니다', emptyHelp: '새로운 자료가 등록되면 이곳에서 확인할 수 있습니다.',
    retryHelp: '자료를 다시 불러오려면 위의 다시 시도를 눌러 주세요.', sideTitle: '무대와 연습의 기록', posterTitle: '포스터에 담긴 소식', posterDescription: '포스터를 누르면 원본을 크게 볼 수 있습니다.\n모집 및 공연 안내를 확인해 보세요.',
    close: '닫기', closeViewer: '확대보기 닫기', relatedConcert: '관련 공연 보기', youtube: 'YouTube에서 보기', previous: '이전', next: '다음',
  },
  join: {
    guideTitle: '함께 노래할\n단원을 기다립니다.', apply: '입단지원서 작성하기', actionNote: '모집 대상과 오디션 안내를 확인한 뒤 지원해 주세요.',
    eligibility: '모집 대상', process: '오디션·절차', practice: '연습 안내', faq: '자주 묻는 질문', parts: '모집 파트', preparation: '준비사항', regular: '정기연습',
    steps: '안내 확인 → 문의 또는 신청 → 상담 및 오디션 → 합창단 활동 시작', location: '오시는 길', faqEmpty: '등록된 질문이 없습니다. 궁금한 내용은 입단 문의로 남겨 주세요.',
    inquiry: '입단 문의하기', ready: '안내를 확인하셨나요?', relatedInquiry: '입단 관련 문의하기',
    applicationTitle: '입단지원서', applicationDescription: '모든 항목은 필수입니다. 연락 가능한 전화번호와 학교·학년을 정확히 작성해 주세요.',
    applicant: '지원자 정보', contact: '연락처', content: '지원 내용', name: '이름', birth: '생년월일', school: '재학 학교·학년',
    applicantPhone: '본인 전화번호', guardianPhone: '보호자 전화번호', desiredParts: '지원 파트', motivation: '합창단 지원 동기',
    namePlaceholder: '이름을 입력해 주세요', schoolPlaceholder: '예: 서울고등학교 2학년', motivationPlaceholder: '합창단에 지원하게 된 이유를 자유롭게 작성해 주세요.',
    partsHelp: '하나 이상 선택해 주세요.', review: '제출 내용 확인', reviewTitle: '제출 전 확인해 주세요.', edit: '수정하기', submit: '지원서 제출하기',
    submitting: '제출 중입니다…', confirmPrevious: '이전 접수 결과 확인', success: '지원서가 접수되었습니다.', successHelp: '오디션 관련 안내는 입력한 연락처를 통해 전달합니다.',
    back: '입단 안내로 돌아가기', loading: '모집 정보와 신청 서버 연결을 확인하고 있습니다.', connectionError: '신청 서버에 연결하지 못했습니다',
    retry: '다시 불러오기', auditionInquiry: '단원 오디션 문의', foundationInquiry: '서울모테트음악재단에 입단 문의하기',
    guideLoading: '입단 안내를 불러오는 중입니다.', applicationLoading: '지원서 정보를 불러오는 중입니다.', guideError: '입단 안내를 불러오지 못했습니다',
    guideEmpty: '공개된 입단 안내가 없습니다', guideErrorHelp: '연결을 확인한 뒤 다시 불러오거나, 궁금한 내용을 문의로 남겨 주세요.', guideEmptyHelp: '현재 공개된 안내를 확인할 수 없습니다. 입단에 관한 자세한 내용은 문의해 주세요.',
  },
  contact: {
    title: '후원·문의', back: '← 후원·문의 전체 보기', description: '후원과 공연 의뢰,\n합창단에 전하고 싶은 이야기를 기다립니다.',
    supportTitle: '후원으로 \n함께해 주세요.', support: '후원 안내', sponsors: '후원사', performance: '공연 의뢰', inquiry: '문의하기', location: '오시는 길',
    regular: '정기 후원', individual: '개인', corporate: '기업', pledgeAction: '후원 약정서 작성', supportInquiry: '후원 문의하기',
    sponsorTitle: '함께하는 후원사', sponsorEmpty: '현재 공개된 후원사 정보가 없습니다.\n후원사 정보는 공개 동의된 내용만 소개합니다.',
    map: '지도·장소 사진 자세히 보기', phone: '전화', email: '이메일',
    inquiryTitle: '이야기를 \n들려주세요.', inquiryDescription: '후원, 공연 의뢰, 일반 문의를 남겨 주세요.\n담당자가 확인한 뒤 입력하신 이메일로 답변드립니다.',
    inquiryPrivacy: '문의 내용은 공개되지 않습니다.', inquiryDelivery: '보내주신 문의는 운영진에게만 전달되며, 문의 유형에 맞춰 확인 후 연락드립니다.',
    inquiryPerformance: '공연 관련 문의는 일정, 장소, 요청 내용을 함께 적어 주세요.', inquiryJoin: '입단지원서는 별도 전용 양식에서 접수합니다.',
    joinAction: '입단지원서로 이동', inquiryType: '문의 유형', required: '필수', optional: '선택',
    nameLabel: '이름', namePlaceholder: '이름을 입력해 주세요', emailLabel: '이메일', emailPlaceholder: '답변받을 이메일을 입력해 주세요',
    phoneLabel: '전화번호', phonePlaceholder: '연락 가능한 번호', titleLabel: '제목', titlePlaceholder: '문의 제목',
    messageLabel: '문의 내용 (필수)', messagePlaceholder: '궁금한 내용이나 요청 사항을 남겨 주세요.', send: '문의 보내기', sending: '전송 중',
    emailCheck: '답변받을 이메일을 한 번 더 확인해 주세요.',
  },
} satisfies Partial<Record<EditorPageId, Record<string, string>>>

const sectionLabels: Partial<Record<EditorPageId, string>> = {
  notices: '공지 목록', 'notice-detail': '공지 상세', concerts: '공연 목록', 'concert-detail': '공연 상세', gallery: '갤러리', contact: '후원·문의', join: '입단 안내와 지원서',
}

export const pageCopyDefinitions: SiteCopyDefinition[] = Object.entries(pageCopyDefaults).flatMap(([page, entries]) => Object.entries(entries).map(([key, defaultValue]) => ({
  key: `${page}.${key}`, page: page as EditorPageId, section: sectionLabels[page as EditorPageId] ?? page,
  label: defaultValue.split('\n')[0], defaultValue, multiline: defaultValue.includes('\n'),
})))
