import { useLocation, useSearchParams } from 'react-router'

import { SeoHead } from '../../components/common/SeoHead'
import { JoinApplicationForm } from '../../components/join/JoinApplicationForm'
import { JoinGuide, type JoinGuideSection } from '../../components/join/JoinGuide'
import { JoinPageState } from '../../components/join/JoinPageState'
import { useJoinData } from '../../hooks/usePublicData'
import '../../styles/join-page.css'

function getJoinSection(value: string | null): JoinGuideSection | 'contact' | 'all' {
  if (
    value === 'eligibility' ||
    value === 'process' ||
    value === 'practice' ||
    value === 'faq' ||
    value === 'contact'
  ) {
    return value
  }
  return 'all'
}

export function JoinPage() {
  const joinData = useJoinData()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const activeSection = getJoinSection(searchParams.get('section'))
  const joinInfo = joinData.data.joinInfo
  const showApplication = activeSection === 'contact' || location.hash === '#application'
  const hasGuide = !joinData.isLoading && !joinData.error && joinInfo && joinInfo.is_visible !== false

  const getSectionHref = (section: JoinGuideSection | 'contact') => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('section', section)
    return `/join?${nextParams.toString()}#${section === 'contact' ? 'application' : section}`
  }

  return (
    <>
      <SeoHead
        description={
          joinInfo?.description ||
          '서울모테트청소년합창단 입단 대상, 절차, 연습과 자주 묻는 질문을 안내합니다.'
        }
        path="/join"
        title={joinInfo?.title || '입단 안내'}
      />
      {!hasGuide ? (
        <JoinPageState
          application={showApplication}
          kind={joinData.isLoading ? 'loading' : joinData.error ? 'error' : 'empty'}
          onRetry={() => void joinData.refetch()}
        />
      ) : !showApplication ? (
        <JoinGuide
          activeSection={activeSection}
          applicationHref={getSectionHref('contact')}
          faqs={joinData.data.faqs}
          getSectionHref={getSectionHref}
          joinInfo={joinInfo}
        />
      ) : (
        <JoinApplicationForm joinInfo={joinInfo} key={joinInfo.id} />
      )}
    </>
  )
}
