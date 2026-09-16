import { TransitionLink } from '../common/TransitionLink'
import { usePageCopy } from '../site-editor/usePageCopy'
import { CopyLines } from '../site-editor/SiteCopy'

type JoinPageStateProps = {
  application: boolean
  kind: 'loading' | 'error' | 'empty'
  onRetry: () => void
}

export function JoinPageState({ application, kind, onRetry }: JoinPageStateProps) {
  const t = usePageCopy('join')
  const isLoading = kind === 'loading'

  return (
    <div aria-busy={isLoading} className="join-guide join-page-state" data-state={kind}>
      <header className="join-page-state__heading join-guide__container">
        <p className="join-guide__eyebrow">{application ? '서울모테트청소년합창단' : '입단 안내'}</p>
        <h1>{application ? t('applicationTitle') : <CopyLines text={t('guideTitle')} />}</h1>
        {isLoading ? (
          <p className="join-guide__body" role="status">
            {application ? t('applicationLoading') : t('guideLoading')}
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
            {kind === 'error' ? t('guideError') : t('guideEmpty')}
          </h2>
          <p className="join-guide__body">
            {kind === 'error'
              ? t('guideErrorHelp')
              : t('guideEmptyHelp')}
          </p>
          <div className="join-page-state__actions">
            {kind === 'error' ? (
              <button className="join-guide__apply-link" onClick={onRetry} type="button">{t('retry')}</button>
            ) : null}
            <TransitionLink className="join-guide__text-link" to="/contact#form">{t('inquiry')} <span aria-hidden="true">↗</span></TransitionLink>
            {application ? <TransitionLink className="join-guide__text-link" to="/join">{t('back')}</TransitionLink> : null}
          </div>
        </section>
      )}
    </div>
  )
}
