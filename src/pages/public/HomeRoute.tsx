import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router'

import { LoadingState } from '../../components/common/LoadingState'
import { HomeSectionFlowPage } from './HomeSectionFlowSamplePage'
import '../../styles/home-v6-fixes.css'
import '../../styles/home-premium-polish.css'
import '../../styles/home-global-refinement.css'
import '../../styles/home-score-redesign.css'

const HomeMotionBenchmarkPage = lazy(() =>
  import('./HomeMotionBenchmarkPage').then((module) => ({
    default: module.HomeMotionBenchmarkPage,
  })),
)

export function HomeRoute() {
  const [searchParams] = useSearchParams()

  if (searchParams.get('motionBenchmark') !== '1') {
    return <HomeSectionFlowPage />
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

