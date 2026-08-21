import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router'

import { LoadingState } from '../../components/common/LoadingState'
import type { AboutPreviewPresentation } from '../../components/home/AboutPreview'
import type { HomeSpiritPresentation } from '../../components/home/HomeSpiritScoreBook'
import { HomeSectionFlowPage } from './HomeSectionFlowSamplePage'
import '../../styles/home-v6-fixes.css'
import '../../styles/home-premium-polish.css'
import '../../styles/home-global-refinement.css'
import '../../styles/home-score-redesign.css'
import '../../styles/home-archive-exposure.css'

const HomeMotionBenchmarkPage = lazy(() =>
  import('./HomeMotionBenchmarkPage').then((module) => ({
    default: module.HomeMotionBenchmarkPage,
  })),
)

export function HomeRoute({
  aboutPresentation = 'default',
  joinOpenScorePresentation = 'default',
  performancePresentation = 'default',
  spiritPresentation = 'editorial',
}: {
  aboutPresentation?: AboutPreviewPresentation
  joinOpenScorePresentation?: 'default' | 'figma-open-score'
  performancePresentation?: 'default' | 'figma-template-carousel'
  spiritPresentation?: HomeSpiritPresentation
} = {}) {
  const [searchParams] = useSearchParams()

  if (searchParams.get('motionBenchmark') !== '1') {
    return (
      <HomeSectionFlowPage
        aboutPresentation={aboutPresentation}
        joinPresentation="open-score"
        joinOpenScorePresentation={joinOpenScorePresentation}
        performancePresentation={performancePresentation}
        spiritPresentation={spiritPresentation}
      />
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-bg-ivory px-5 py-24">
          <LoadingState label="모션 벤치마크를 준비하는 중입니다." />
        </div>
      }
    >
      <HomeMotionBenchmarkPage />
    </Suspense>
  )
}

