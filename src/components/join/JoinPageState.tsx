import { TransitionLink } from '../common/TransitionLink'

type JoinPageStateProps = {
  application: boolean
  kind: 'loading' | 'error' | 'empty'
  onRetry: () => void
}

export function JoinPageState({ application, kind, onRetry }: JoinPageStateProps) {
  const isLoading = kind === 'loading'

  return (
    <div aria-busy={isLoading} className="join-guide join-page-state" data-state={kind}>
      <header className="join-page-state__heading join-guide__container">
        <p className="join-guide__eyebrow">{application ? '서울모테트청소년합창단' : '입단 안내'}</p>
        <h1>{application ? '입단지원서' : <>함께 노래할<br />단원을 기다립니다.</>}</h1>
        {isLoading ? (
          <p className="join-guide__body" role="status">
            {application ? '지원서 정보를 불러오는 중입니다.' : '입단 안내를 불러오는 중입니다.'}
          </p>
        ) : null}
      </header>

      {isLoading ? (
        <div aria-hidden="true" className="join-page-state__skeleton join-guide__container">
          <div className="join-page-state__skeleton-nav">
            {[0, 1, 2, 3].map(index => <span key={index} />)}
          </div>
          <div className="join-page-state__skeleton-content">
            <div className="join-page-state__skeleton-title" />
            <div className="join-page-state__skeleton-lines">
              <span /><span /><span />
            </div>
          </div>
        </div>
      ) : (
        <section aria-labelledby="join-state-title" className="join-page-state__message join-guide__container">
          <h2 id="join-state-title">
            {kind === 'error' ? '입단 안내를 불러오지 못했습니다' : '공개된 입단 안내가 없습니다'}
          </h2>
          <p className="join-guide__body">
            {kind === 'error'
              ? '연결을 확인한 뒤 다시 불러오거나, 궁금한 내용을 문의로 남겨 주세요.'
              : '현재 공개된 안내를 확인할 수 없습니다. 입단에 관한 자세한 내용은 문의해 주세요.'}
          </p>
          <div className="join-page-state__actions">
            {kind === 'error' ? (
              <button className="join-guide__apply-link" onClick={onRetry} type="button">다시 불러오기</button>
            ) : null}
            <TransitionLink className="join-guide__text-link" to="/contact#form">입단 문의하기 <span aria-hidden="true">↗</span></TransitionLink>
            {application ? <TransitionLink className="join-guide__text-link" to="/join">입단 안내로 돌아가기</TransitionLink> : null}
          </div>
        </section>
      )}
    </div>
  )
}
