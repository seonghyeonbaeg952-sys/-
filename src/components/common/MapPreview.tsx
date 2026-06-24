import { Button } from './Button'
import { Card } from './Card'
import { getMapActions } from '../../utils/mapLinks'

type MapPreviewProps = {
  address?: string | null
  embedUrl?: string | null
  kakaoMapUrl?: string | null
  naverMapUrl?: string | null
  placeName?: string | null
}

export function MapPreview({
  address,
  embedUrl,
  kakaoMapUrl,
  naverMapUrl,
  placeName,
}: MapPreviewProps) {
  const resolvedPlaceName = placeName?.trim() || '서울모테트청소년합창단'
  const resolvedAddress = address?.trim()
  const mapActions = getMapActions({
    address: resolvedAddress,
    embedUrl,
    kakaoMapUrl,
    naverMapUrl,
  })

  return (
    <Card className="overflow-hidden">
      {mapActions.embedSrc ? (
        <iframe
          className="h-[260px] w-full border-0 md:h-[360px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapActions.embedSrc}
          title={`${resolvedPlaceName} 지도`}
        />
      ) : (
        <div className="bg-bg-warm-white p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-warm">
            LOCATION
          </p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h3 className="break-keep text-2xl font-semibold text-navy-deep md:text-3xl">
                오시는 길
              </h3>
              <p className="mt-3 break-keep text-sm leading-7 text-text-muted">
                아래 버튼을 눌러 지도 앱에서 위치를 확인하세요.
              </p>
              <div className="mt-5 rounded-button border border-line-default bg-bg-ivory px-4 py-3">
                <p className="text-sm font-semibold text-navy-deep">
                  {resolvedPlaceName}
                </p>
                <p className="mt-1 break-keep text-sm leading-6 text-text-muted">
                  {resolvedAddress || '지도 정보 준비 중'}
                </p>
              </div>
            </div>
            <div className="h-px w-full bg-gold-warm/45 md:h-24 md:w-px" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="border-t border-line-default bg-bg-warm-white p-5">
        {mapActions.buttons.length > 0 ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            {mapActions.buttons.map((button) => (
              <Button
                className="w-full sm:w-auto"
                href={button.href}
                key={button.provider}
                rel="noreferrer"
                target="_blank"
                variant="secondary"
              >
                {button.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="rounded-button bg-bg-ivory px-4 py-3 text-sm text-text-muted">
            주소나 지도 링크가 등록되면 이 영역에 바로가기 버튼이 표시됩니다.
          </p>
        )}
      </div>
    </Card>
  )
}
