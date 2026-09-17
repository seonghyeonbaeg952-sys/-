import { FormattedCopy } from '../../components/site-editor/FormattedCopy'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { SeoHead } from '../../components/common/SeoHead'
import { OptimizedImage } from '../../components/common/OptimizedImage'
import { formatNoticeDate, getNoticeCategoryLabel } from '../../components/notices/noticeViewModel'
import { useNoticeDetailData } from '../../hooks/usePublicData'
import { usePageCopy } from '../../components/site-editor/usePageCopy'
import '../../styles/notices-page.css'

export function NoticeDetailPage() {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('notice-detail')
  const { noticeId } = useParams()
  const [searchParams] = useSearchParams()
  const noticeData = useNoticeDetailData(noticeId)
  const [failedImage, setFailedImage] = useState('')
  const notice = noticeData.data?.is_visible ? noticeData.data : null
  const listSearch = searchParams.toString()
  const listLocation = { pathname: '/notices', search: listSearch ? `?${listSearch}` : '' }

  return (
    <div className="notices-page">
      <SeoHead
        description={notice?.content || '서울모테트청소년합창단 공지 상세'}
        image={notice?.cover_image_url}
        noIndex={!noticeData.isLoading && !notice}
        path={noticeId ? `/notices/${encodeURIComponent(noticeId)}` : '/notices'}
        title={notice?.title || '공지 상세'}
        type="article"
      />
      <div className="notices-page__detail notices-page__shell">
        <nav aria-label={copyText("notice-detail", "notice-detail.fixed.NoticeDetailPage.e282a8fa21", "현재 위치")} className="notices-page__breadcrumb">
          <Link to={listLocation}>{<FormattedCopy page="notice-detail" id="notice-detail.list" text={t('list')}>{t('list')}</FormattedCopy>}</Link><span aria-hidden="true">/</span><span aria-current="page">{<FormattedCopy page="notice-detail" id="notice-detail.title" text={t('title')}>{t('title')}</FormattedCopy>}</span>
        </nav>
        {noticeData.isLoading ? (
          <div className="notices-page__state"><LoadingState label={t('loading')} /></div>
        ) : noticeData.error ? (
          <div className="notices-page__state" role="alert">
            <h1 className="sr-only">{t('title')}</h1>
            <ErrorState
              title={t('error')}
              description={t('connection')}
              action={<button className="notices-page__action" onClick={noticeData.refetch} type="button">{<FormattedCopy page="notice-detail" id="notice-detail.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</button>}
            />
          </div>
        ) : !notice ? (
          <div className="notices-page__state" role="status">
            <h1>{<FormattedCopy page="notice-detail" id="notice-detail.missing" text={t('missing')}>{t('missing')}</FormattedCopy>}</h1>
            <p>{<FormattedCopy page="notice-detail" id="notice-detail.missingHelp" text={t('missingHelp')}>{t('missingHelp')}</FormattedCopy>}</p>
          </div>
        ) : (
          <article className="notices-page__article">
            <div className="notices-page__meta">
              <span>{notice.is_important ? <FormattedCopy page="notice-detail" id="notice-detail.fixed.NoticeDetailPage.39b62d01a5" text={copyText("notice-detail", "notice-detail.fixed.NoticeDetailPage.39b62d01a5", "중요 공지")}>{copyText("notice-detail", "notice-detail.fixed.NoticeDetailPage.39b62d01a5", "중요 공지")}</FormattedCopy> : <FormattedCopy page="notice-detail" id={`notice-detail.category.${notice.category}`} text={copyText('notice-detail', `notice-detail.category.${notice.category}`, getNoticeCategoryLabel(notice.category))}>{copyText('notice-detail', `notice-detail.category.${notice.category}`, getNoticeCategoryLabel(notice.category))}</FormattedCopy>}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={notice.created_at}>{formatNoticeDate(notice.created_at)}</time>
            </div>
            <h1 className="notices-page__detail-title">{notice.title}</h1>
            {notice.cover_image_url ? (
              failedImage === notice.cover_image_url ? (
                <div className="notices-page__image-error" role="status">
                  <p>{<FormattedCopy page="notice-detail" id="notice-detail.imageError" text={t('imageError')}>{t('imageError')}</FormattedCopy>}</p>
                  <button className="notices-page__action" onClick={() => setFailedImage('')} type="button">{<FormattedCopy page="notice-detail" id="notice-detail.imageRetry" text={t('imageRetry')}>{t('imageRetry')}</FormattedCopy>}</button>
                </div>
              ) : <OptimizedImage
                alt={`${notice.title} 대표 이미지`}
                className="notices-page__image"
                imageClassName="notices-page__detail-image"
                objectFit="contain"
                onError={() => setFailedImage(notice.cover_image_url)}
                sizes="(min-width: 1280px) 1084px, calc(100vw - 48px)"
                src={notice.cover_image_url}
                transform={{ quality: 85, resize: 'contain', width: 1280, widths: [640, 960, 1280] }}
              />
            ) : null}
            <div className="notices-page__body">{notice.content || <FormattedCopy page="notice-detail" id="notice-detail.bodyEmpty" text={t('bodyEmpty')}>{t('bodyEmpty')}</FormattedCopy>}</div>
          </article>
        )}
        <div className="notices-page__back">
          <Link className="notices-page__action" to={listLocation}>{<FormattedCopy page="notice-detail" id="notice-detail.back" text={t('back')}>{t('back')}</FormattedCopy>}</Link>
        </div>
      </div>
    </div>
  )
}
