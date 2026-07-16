# 서울모테트청소년합창단 UI kit · Figma Make 벤치마크

- 조사일: 2026-07-16
- 범위: 공식 디자인 시스템, Figma UI kit, 문화예술·교육·비영리 템플릿, Figma Make 공개 사례
- 확인 수: 직접 링크 85개(디자인 시스템 20, 문화·공연 템플릿 26, 모바일·접근성 리소스 25, Figma Make 14)
- 원칙: 새 UI 라이브러리를 설치하지 않고, 현재 React·Tailwind 디자인 언어 안에 필요한 패턴만 적용한다.

## 이번 구현에 바로 반영한 결론

1. Porsche·Sonorous 계열처럼 짧은 데스크톱 화면에서도 Hero CTA를 첫 화면 안에 둔다.
2. Atlassian·Backpack·SAP Fiori처럼 모바일 탭은 44px 이상 한 줄 스크롤형으로 만들고 선택 항목을 노출한다.
3. SAP Fiori iOS·Tiles 계열처럼 모바일 Quick card의 정보와 행동을 세 장 모두 유지한다.
4. Spectrum·Satz처럼 장식용 제목 서체와 읽기용 본문 서체를 분리한다.
5. GOV.UK·IBM Accessibility처럼 포커스 표시와 44px 터치 영역을 공통 컴포넌트 기본값으로 둔다.
6. GitLab Pajamas처럼 눌리지 않는 정보 카드에는 hover affordance를 주지 않는다.

## 1. 웹 UI kit · 디자인 시스템 20개

| # | 리소스 | 합창단 적용 관점 |
|---:|---|---|
| 1 | [IBM Carbon Design System](https://carbondesignsystem.com/) | Navy·Gold·Ivory를 역할 기반 토큰으로 통일 |
| 2 | [Atlassian Design System](https://atlassian.design/components) | 탭 선택 상태와 키보드 포커스 명료화 |
| 3 | [Shopify Polaris](https://shopify.dev/docs/api/polaris) | 방문자 UI와 관리자 CMS 밀도 분리 |
| 4 | [GitHub Primer](https://primer.style/) | Brand UI와 Product UI의 목적 분리 |
| 5 | [Adobe Spectrum](https://spectrum.adobe.com/) | 주 CTA와 quiet 보조 행동의 계층화 |
| 6 | [Ant Design](https://ant.design/components/overview/) | 입단 절차를 단계·타임라인으로 표현 |
| 7 | [Salesforce Lightning Design System 2](https://www.lightningdesignsystem.com/) | 상태를 색상뿐 아니라 라벨·아이콘으로 전달 |
| 8 | [GOV.UK Design System](https://design-system.service.gov.uk/components/) | 오류 요약과 필드 오류 연결 |
| 9 | [U.S. Web Design System](https://designsystem.digital.gov/) | 일관된 콘텐츠 폭과 skip link·포커스 |
| 10 | [NHS Digital Service Manual](https://service-manual.nhs.uk/design-system/index) | 중요한 변경·취소 정보를 알림 배너로 구분 |
| 11 | [PatternFly](https://www.patternfly.org/components/overview/) | 모바일 overflow 탐색과 44px 조작 영역 |
| 12 | [Elastic UI Framework](https://eui.elastic.co/) | 홈 섹션 간 간격 단계 단순화 |
| 13 | [Uber Base Web](https://baseweb.design/components/) | 포스터·공연 이미지 비율 보존 |
| 14 | [Porsche Design System](https://designsystem.porsche.com/) | 프리미엄 무대감과 반응형 Hero CTA |
| 15 | [Twilio Paste](https://paste.twilio.design/) | 설명과 다음 행동이 있는 Empty state |
| 16 | [Zendesk Garden](https://garden.zendesk.com/components/) | 모바일 sheet·drawer의 닫기와 포커스 복귀 |
| 17 | [GitLab Pajamas](https://design.gitlab.com/components/) | 불필요한 카드 박스를 줄이는 unboxing 원칙 |
| 18 | [SAP Fiori for Web](https://www.sap.com/design-system/fiori-design-web) | 로딩 실패·빈 상태의 원인과 재시도 행동 |
| 19 | [Skyscanner Backpack](https://www.skyscanner.design/) | 긴 한국어·영문 혼합 라벨의 유동 폭 |
| 20 | [Kiwi.com Orbit](https://orbit.kiwi/) | 제목·설명의 일관된 voice & tone |

## 2. 음악·공연·문화·교육·비영리·에디토리얼 템플릿 26개

| # | 리소스 | 합창단 적용 관점 |
|---:|---|---|
| 1 | [Music X](https://webflow.com/templates/html/music-x-music-website-template) | 다음 공연 날짜·장소·예매 행동 우선 |
| 2 | [Sonorous](https://webflow.com/templates/html/sonorous-event-website-template) | Deep Navy 공연 Hero와 즉시 CTA |
| 3 | [Noize 128](https://webflow.com/templates/html/noize-128-music-website-template) | 다음 무대 → 소식 → 미디어 순서 |
| 4 | [PRVSM](https://www.framer.com/community/marketplace/templates/prvsm/) | 대형 타이포는 제한적으로, 공연 리본은 차분하게 |
| 5 | [Sympos](https://www.framer.com/marketplace/templates/sympos/) | 지휘자·반주자·게스트 프로필 규격 통일 |
| 6 | [GatherFlow](https://webflow.com/templates/html/gatherflow-event-website-template) | 날짜 축과 시간표가 결합된 프로그램 |
| 7 | [Eventure](https://templates.webflow.com/html/eventure-event-website-template) | 공연 유형별 공통 CMS 카드 |
| 8 | [StagePro](https://webflow.com/templates/html/stagepro-website-template) | 공연 상세 앵커 내비게이션 |
| 9 | [Evento](https://webflow.com/templates/html/evento-event-website-template) | FAQ·절차·문의 CTA 모듈화 |
| 10 | [Meetzen](https://webflow.com/templates/html/meetzen-website-template) | 후원사를 공연 맥락과 함께 설명 |
| 11 | [ArtGallery](https://templates.webflow.com/html/artgallery-website-template) | 포스터·사진·프로그램북 아카이브 분리 |
| 12 | [Museum X](https://webflow.com/templates/html/museum-x-artist-website-template) | 시대별 주요 공연 중심의 전시형 연혁 |
| 13 | [Art Gallery 128](https://templates.webflow.com/html/art-gallery-artist-website-template) | 인물사진보다 경력·철학 중심 리더십 문서 |
| 14 | [Will](https://webflow.com/templates/html/will-portfolio-website-template) | 대표 무대 → 설명 → 관련 미디어 흐름 |
| 15 | [Education X](https://webflow.com/templates/html/education-x-education-website-template) | 대상 → 교육 → 일정 → 선발 절차 |
| 16 | [Eduvolv](https://templates.webflow.com/html/eduvolv-website-template) | 연습·캠프·교류행사 유형별 카드 |
| 17 | [Hopedu](https://webflow.com/templates/html/hopedu-school-website-template) | 학부모가 궁금한 일정·비용·준비물 단계화 |
| 18 | [Charitable](https://webflow.com/templates/html/charitable-website-template) | 후원 필요성 → 활동 → 참여 방법 → 문의 |
| 19 | [Fundraising](https://webflow.com/templates/html/fundraising-charity-website-template) | 금액보다 교육·공연의 변화 먼저 설명 |
| 20 | [Kindera](https://www.framer.com/community/marketplace/templates/kindera/) | 얼굴 중심 대신 악보·공간·활동 수치 활용 |
| 21 | [Charis](https://www.framer.com/community/marketplace/templates/charis/) | 지성·인성·영성과 실제 활동 연결 |
| 22 | [Ministry](https://templates.webflow.com/html/ministry-church-website-template) | 핵심 원칙과 실천 사례 분리 |
| 23 | [Journalism](https://webflow.com/templates/html/journalism-news-website-template) | 공지·공연 후기·교육 이야기 유형 구분 |
| 24 | [Newsroom](https://webflow.com/templates/html/newsroom-blog-website-template) | 주요 소식 1건과 조밀한 최근 목록 |
| 25 | [Reporter](https://templates.webflow.com/html/reporter-news-website-template) | 주요 기사·공지·기록의 카드 밀도 차등 |
| 26 | [Satz](https://www.framer.com/marketplace/templates/satz/) | 제목·본문 서체 분리와 긴 글 읽기 폭 |

## 3. 모바일·접근성·반응형 UI kit 25개

| # | 리소스 | 합창단 적용 관점 |
|---:|---|---|
| 1 | [Apple watchOS 26 UI Kit](https://www.figma.com/community/file/1540060090060216489/watchos-26) | 작은 화면에서 핵심 정보와 한 행동 우선 |
| 2 | [Apple App Clips Template](https://www.figma.com/community/file/1367914571662801866/app-clips) | 자격 확인 → 지원 문의의 짧은 진입 흐름 |
| 3 | [Apple Live Activities Template](https://www.figma.com/community/file/1367915437752334285/live-activities) | 다음 공연 날짜·예매·길찾기 상태 카드 |
| 4 | [Compose for Wear OS Kit](https://developer.android.com/design/ui/wear/guides/m2-5/foundations/download?hl=en) | 작은 컨트롤도 충분한 터치 크기 유지 |
| 5 | [Tiles on Wear OS Kit](https://developer.android.com/design/ui/wear/guides/m2-5/foundations/download?hl=en) | 공지·공연·입단 요약 카드 규격 통일 |
| 6 | [Samsung One UI Design System](https://developer.samsung.com/one-ui/index.html) | 상단 감상, 하단 엄지 도달 행동 영역 |
| 7 | [SAP Fiori for Android](https://www.figma.com/community/file/1450854922902736692/fiori-for-android-design-kit) | 모바일 1열·태블릿 2열 적응형 카드 |
| 8 | [SAP Fiori for iOS](https://www.figma.com/community/file/1450853598524410675/fiori-for-ios-design-kit) | Quick card의 높이·정보·행동 일관성 |
| 9 | [SAP Fiori for Wear OS](https://www.figma.com/file/i7U2Y73KsqF2oQFTxFvXuG/Fiori-for-Wear-OS-1.0---UI-Kit?node-id=0%3A1) | 깊은 하위 메뉴를 줄인 직접 탐색 |
| 10 | [SAP Fiori for watchOS](https://www.figma.com/file/Oi7jIM7klLwu1YbVXMZdcS/Fiori-for-watchOS-1.0---UI-Kit?node-id=0%3A1) | 일정 카드의 날짜 우선 계층 |
| 11 | [SAP S/4HANA Web UI Kit – Cozy](https://experience.sap.com/fiori-design-web/design-stencils-for-figma/) | 390·768px에서 패딩과 열 수 전환 |
| 12 | [Carbon Native Mobile](https://www.figma.com/design/O3KSDu2TWpMaazGkgsKqLA/-Beta--Carbon-Native-Mobile-%E2%80%93-Carbon-Design-System?m=auto) | 버튼·필드·상태 메시지 공통 토큰 |
| 13 | [IBM Accessibility Design Kit](https://www.figma.com/community/file/1118184491812988116) | 탭 순서·대체 텍스트·오류 연결 체크 |
| 14 | [Adobe Spectrum UI Kits](https://spectrum.adobe.com/page/ui-kits/) | 모바일 간격·타이포 별도 스케일 |
| 15 | [GitHub Primer Web](https://www.figma.com/community/file/854767373644076713) | 선택 상태를 색상 외 형태로도 표시 |
| 16 | [Atlassian Figma Libraries](https://www.figma.com/@atlassian) | 포커스 링과 버튼 상태 토큰화 |
| 17 | [GitLab Pajamas UI Kit](https://www.figma.com/community/file/781156790581391771/component-library/component-library) | 공통 컴포넌트와 페이지 조합 분리 |
| 18 | [Shopify Polaris Components](https://www.figma.com/community/file/1293611962331823010/polaris-components) | 아이콘과 짧은 텍스트 라벨 병행 |
| 19 | [Intelligence Community Design System](https://design.sis.gov.uk/get-started/design/figma/) | 왼쪽 정렬의 단순한 선형 흐름 |
| 20 | [MOD.UK Figma Design Library](https://www.figma.com/file/JrmVrSdKCHUZBQFEB3xsjJ/Figma-Design-Library?node-id=50-5303) | 검증된 UI와 실험적 장식 분리 |
| 21 | [ONS Low-fidelity Library](https://www.figma.com/file/weNwir9gZnRgBTVR3r1XXO/ONS---Low-fidelity-library?mode=design&node-id=0-1) | 장식 전 모바일 흐름 순서 검증 |
| 22 | [ONS Design System 2.0](https://www.figma.com/file/CXgPccFxG4lBlrTWhD6gK8/ONS-Design-system-2.0-%288px-grid%29?node-id=1869-30934) | 8px 배수의 모바일 여백·간격 |
| 23 | [VA Design System Library](https://design.va.gov/about/designers/design-libraries) | 360px 폼과 접근성 주석·오류 요약 |
| 24 | [Home Office Design Library](https://www.figma.com/file/y90OmHLuhtNuCUOc7jzQlj/Home-Office-design-library-Roboto) | 짧은 설명과 입력 바로 아래 오류 |
| 25 | [GOV.UK Figma Library](https://www.figma.com/file/NWuFffKvPQhl3aJ9nKU0p3/GOV.UK-Design-System?node-id=0%3A1) | 단일 열 폼·명시적 라벨·상단 오류 요약 |

## 4. Figma Make 공개 사례 14개

원본 카탈로그: [Figma Make Community](https://www.figma.com/files/team/1624762936754085820/resources/community/make?fuid=1624762933882615651&resource_type=files&editor_type=make)

| # | Make 사례 | 합창단 적용 관점 |
|---:|---|---|
| 1 | [Android Music Player with Spinning Gramophone](https://www.figma.com/community/file/1530546512157795778/android-music-player-with-spinning-gramophone) | 대표 공연 영상·음원의 큰 미디어 카드 |
| 2 | [Canvas Gallery](https://www.figma.com/community/file/1530683413957635408/canvas-gallery) | 세리프 캡션이 있는 포스터·공연 아카이브 |
| 3 | [Rotor: Kinetic Cylindrical Gallery](https://www.figma.com/community/file/1539099433640763293/rotor-kinetic-cylindrical-gallery) | 데스크톱 포스터 탐색, reduced-motion 대안 필수 |
| 4 | [MIDI Piano Synthesizer App](https://www.figma.com/community/file/1530609787855179696/midi-piano-synthesizer-app) | 교육·연습용 단계적 인터랙션 |
| 5 | [Gospel Dashboard Application](https://www.figma.com/community/file/1530572084124007052/gospel-dashboard-application) | 활동 현황과 관리자 요약 정보 구조 |
| 6 | [YouTube DJ](https://www.figma.com/community/file/1530334989207758899/youtube-dj) | 공연 영상 큐와 명확한 선택 상태 |
| 7 | [Video Editor Storyboard Portfolio](https://www.figma.com/community/file/1533037601969539992/video-editor-storyboard-portfolio) | 공연별 기록·장면·프로그램 노트 순서화 |
| 8 | [Showcase slider](https://www.figma.com/community/file/1546082119419591510/showcase-slider-interactive-template) | 한 항목 집중형 공연 하이라이트와 진행 제어 |
| 9 | [Weekly Class Schedule Dashboard](https://www.figma.com/community/file/1544232530357906404/weekly-class-schedule-dashboard) | 연습·공연 주간 일정 그룹화 |
| 10 | [Digital Services — Medan City](https://www.figma.com/community/file/1530870375234127759/digital-services-medan-city-government-official-portal) | 입단·문의·후원 경로의 서비스형 길찾기 |
| 11 | [ContraQuest EdTech](https://www.figma.com/community/file/1550855258080865084/contraquest-next-gen-gamified-edtech-experience-by-abhishek-dhande) | 청소년 교육 온보딩, 과도한 게임화는 배제 |
| 12 | [Portfolio website — awwwards style](https://www.figma.com/community/file/1580797077868229109/portfolio-website-awwwards-style) | 시즌·정체성 소개의 대형 타이포와 스토리 |
| 13 | [School Bus Tracking System](https://www.figma.com/community/file/1534582628211748825/school-bus-tracking-system-mobile-app) | 보호자용 상태·타임라인·공지, 위치정보는 차용 금지 |
| 14 | [Collections App](https://www.figma.com/community/file/1650929760754370641/collections-app) | 연도·시즌별 공연·포스터·사진 컬렉션 |

## 채택 우선순위

- 즉시 채택: 한 줄 모바일 탭, 44px 터치 영역, 읽기용 본문 서체, 짧은 화면 Hero CTA, 동일 정보량의 Quick card.
- 다음 개선 후보: 공연 상세 앵커, 포스터·사진·영상 아카이브 분리, 공지 중요도별 밀도, Empty/Error 상태 통일.
- 배제: 네온 중심 음악 템플릿, 청소년 얼굴사진 중심 소개, 자동 회전 3D 갤러리, 과도한 게임화, 위치·개인정보를 노출하는 보호자 기능.
