import { FormattedCopy } from '../site-editor/FormattedCopy'
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
        <h1>{application ? <FormattedCopy page="join" id="join.applicationTitle" text={t('applicationTitle')}>{t('applicationTitle')}</FormattedCopy> : <FormattedCopy page="join" id="join.guideTitle" text={t('guideTitle')} lineBreaks><CopyLines text={t('guideTitle')} /></FormattedCopy>}</h1>
        {isLoading ? (
          <p className="join-guide__body" role="status">
            {application ? <FormattedCopy page="join" id="join.applicationLoading" text={t('applicationLoading')}>{t('applicationLoading')}</FormattedCopy> : <FormattedCopy page="join" id="join.guideLoading" text={t('guideLoading')}>{t('guideLoading')}</FormattedCopy>}
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
            {kind === 'error' ? <FormattedCopy page="join" id="join.guideError" text={t('guideError')}>{t('guideError')}</FormattedCopy> : <FormattedCopy page="join" id="join.guideEmpty" text={t('guideEmpty')}>{t('guideEmpty')}</FormattedCopy>}
          </h2>
          <p className="join-guide__body">
            {kind === 'error'
              ? <FormattedCopy page="join" id="join.guideErrorHelp" text={t('guideErrorHelp')}>{t('guideErrorHelp')}</FormattedCopy>
              : <FormattedCopy page="join" id="join.guideEmptyHelp" text={t('guideEmptyHelp')}>{t('guideEmptyHelp')}</FormattedCopy>}
          </p>
          <div className="join-page-state__actions">
            {kind === 'error' ? (
              <button className="join-guide__apply-link" onClick={onRetry} type="button">{<FormattedCopy page="join" id="join.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</button>
            ) : null}
            <TransitionLink className="join-guide__text-link" to="/contact#form">{<FormattedCopy page="join" id="join.inquiry" text={t('inquiry')}>{t('inquiry')}</FormattedCopy>} <span aria-hidden="true">↗</span></TransitionLink>
            {application ? <TransitionLink className="join-guide__text-link" to="/join">{<FormattedCopy page="join" id="join.back" text={t('back')}>{t('back')}</FormattedCopy>}</TransitionLink> : null}
          </div>
        </section>
      )}
    </div>
  )
}
