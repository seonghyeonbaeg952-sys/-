import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { AdminErrorState } from '../../components/admin/AdminErrorState'
import { AdminLoadingState } from '../../components/admin/AdminLoadingState'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { AdminSwitch } from '../../components/admin/AdminSwitch'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { MapPreview } from '../../components/common/MapPreview'
import { useCrudItem } from '../../hooks/useCrudItem'
import type { CmsMutationPayload, LocationRow } from '../../types/cms'
import { getMapActions, isLikelyEmbeddableMapUrl } from '../../utils/mapLinks'

type LocationFormValues = {
  address: string
  email: string
  fax: string
  image_alt: string
  image_caption: string
  image_url: string
  is_visible: boolean
  kakao_map_url: string
  map_embed_url: string
  naver_map_url: string
  parking_info: string
  phone: string
  place_name: string
  transit_info: string
}

function toFormValues(row: LocationRow | null): LocationFormValues {
  return {
    address: row?.address ?? '',
    email: typeof row?.email === 'string' ? row.email : '',
    fax: typeof row?.fax === 'string' ? row.fax : '',
    image_alt: typeof row?.image_alt === 'string' ? row.image_alt : '',
    image_caption: typeof row?.image_caption === 'string' ? row.image_caption : '',
    image_url: typeof row?.image_url === 'string' ? row.image_url : '',
    is_visible: row?.is_visible ?? true,
    kakao_map_url: row?.kakao_map_url ?? '',
    map_embed_url: row?.map_embed_url ?? '',
    naver_map_url: row?.naver_map_url ?? '',
    parking_info: row?.parking_info ?? '',
    phone: row?.phone ?? '',
    place_name: row?.place_name ?? '',
    transit_info: row?.transit_info ?? '',
  }
}

function nullable(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || null
}

function isCmsErrorResult(value: unknown): value is { error: string | null } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error?: unknown }).error === 'string'
  )
}

function isOptionalColumnError(error: string) {
  const normalizedError = error.toLowerCase()

  return (
    normalizedError.includes('map_embed_url') ||
    normalizedError.includes('email') ||
    normalizedError.includes('fax') ||
    normalizedError.includes('image_url') ||
    normalizedError.includes('image_alt') ||
    normalizedError.includes('image_caption') ||
    normalizedError.includes('column') ||
    normalizedError.includes('schema cache')
  )
}

function inputClass() {
  return 'mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'
}

function labelClass() {
  return 'text-sm font-semibold text-navy-deep'
}

function textareaClass() {
  return 'mt-2 w-full rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60'
}

export function AdminLocationPage() {
  const crud = useCrudItem('locations')

  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="관리자는 주소만 입력해도 됩니다. 방문자 화면에서는 주소 기반 네이버지도/카카오맵 버튼이 자동으로 생성됩니다."
        title="오시는 길 관리"
      />

      <Card className="p-6">
        <div className="mb-6 rounded-button border border-gold-warm/35 bg-bg-ivory px-4 py-3 text-sm leading-6 text-text-muted">
          <p className="font-semibold text-navy-deep">
            주소를 입력하면 방문자 화면에서 지도 보기 버튼이 자동으로 생성됩니다.
          </p>
          <p className="mt-1">
            지도 URL은 직접 입력하지 않아도 됩니다. 특정 장소 링크가 필요할 때만 고급 설정을 사용하세요.
          </p>
        </div>

        {crud.message ? (
          <p className="mb-5 rounded-button bg-state-success/10 px-4 py-3 text-sm text-state-success" role="status">
            {crud.message}
          </p>
        ) : null}

        {crud.isLoading ? <AdminLoadingState /> : null}
        {!crud.isLoading && crud.error ? (
          <AdminErrorState description={crud.error} />
        ) : null}

        {!crud.isLoading && !crud.error ? (
          <LocationForm
            disabled={crud.isMutating}
            initialValues={toFormValues(crud.item)}
            key={crud.item?.id ?? 'new-location'}
            onSubmit={crud.saveItem}
          />
        ) : null}
      </Card>
    </div>
  )
}

function LocationForm({
  disabled,
  initialValues,
  onSubmit,
}: {
  disabled: boolean
  initialValues: LocationFormValues
  onSubmit: (payload: CmsMutationPayload) => Promise<unknown>
}) {
  const [values, setValues] = useState<LocationFormValues>(initialValues)

  const mapActions = useMemo(() => {
    return getMapActions({
      address: values.address,
      embedUrl: values.map_embed_url,
      kakaoMapUrl: values.kakao_map_url,
      naverMapUrl: values.naver_map_url,
    })
  }, [values.address, values.kakao_map_url, values.map_embed_url, values.naver_map_url])

  const statusMessages = useMemo(() => {
    const messages = ['주소 기반 지도 버튼이 자동 생성됩니다.']

    if (values.naver_map_url.trim()) {
      messages.push('직접 입력한 네이버지도 URL이 사용됩니다.')
    }

    if (values.kakao_map_url.trim()) {
      messages.push('직접 입력한 카카오맵 URL이 사용됩니다.')
    }

    if (values.map_embed_url.trim()) {
      messages.push(
        isLikelyEmbeddableMapUrl(values.map_embed_url)
          ? 'embed URL이 iframe으로 표시됩니다.'
          : 'embed URL이 없거나 표시할 수 없어 버튼으로 대체됩니다.',
      )
    }

    return messages
  }, [values.kakao_map_url, values.map_embed_url, values.naver_map_url])

  const updateValue = <TKey extends keyof LocationFormValues>(
    key: TKey,
    value: LocationFormValues[TKey],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload: CmsMutationPayload = {
      address: nullable(values.address),
      is_visible: values.is_visible,
      kakao_map_url: nullable(values.kakao_map_url),
      naver_map_url: nullable(values.naver_map_url),
      parking_info: nullable(values.parking_info),
      phone: nullable(values.phone),
      place_name: nullable(values.place_name),
      transit_info: nullable(values.transit_info),
    }

    const optionalPayload: CmsMutationPayload = {}

    optionalPayload.email = nullable(values.email)
    optionalPayload.fax = nullable(values.fax)
    optionalPayload.map_embed_url = nullable(values.map_embed_url)
    optionalPayload.image_url = nullable(values.image_url)
    optionalPayload.image_alt = nullable(values.image_alt)
    optionalPayload.image_caption = nullable(values.image_caption)

    const result = await onSubmit({ ...payload, ...optionalPayload })

    if (
      Object.keys(optionalPayload).length > 0 &&
      isCmsErrorResult(result) &&
      result.error &&
      isOptionalColumnError(result.error)
    ) {
      await onSubmit(payload)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span className={labelClass()}>장소명</span>
                <input
                  className={inputClass()}
                  onChange={(event) => updateValue('place_name', event.target.value)}
                  placeholder="서울모테트음악재단"
                  value={values.place_name}
                />
              </label>
              <label>
                <span className={labelClass()}>문의 전화</span>
                <input
                  className={inputClass()}
                  onChange={(event) => updateValue('phone', event.target.value)}
                  placeholder="대표 전화번호"
                  value={values.phone}
                />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass()}>주소</span>
                <textarea
                  className={textareaClass()}
                  onChange={(event) => updateValue('address', event.target.value)}
                  placeholder="서울특별시 서초구 사임당로 8길 17 서주빌딩 B1"
                  rows={3}
                  value={values.address}
                />
              </label>
              <label>
                <span className={labelClass()}>FAX</span>
                <input
                  className={inputClass()}
                  onChange={(event) => updateValue('fax', event.target.value)}
                  value={values.fax}
                />
              </label>
              <label>
                <span className={labelClass()}>이메일</span>
                <input
                  className={inputClass()}
                  onChange={(event) => updateValue('email', event.target.value)}
                  type="email"
                  value={values.email}
                />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass()}>대중교통 안내</span>
                <textarea
                  className={textareaClass()}
                  onChange={(event) => updateValue('transit_info', event.target.value)}
                  rows={5}
                  value={values.transit_info}
                />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass()}>주차 안내</span>
                <textarea
                  className={textareaClass()}
                  onChange={(event) => updateValue('parking_info', event.target.value)}
                  rows={4}
                  value={values.parking_info}
                />
              </label>
            </div>

            <div className="rounded-formal border border-line-default bg-bg-ivory p-5">
              <ImageUploader
                description="방문자 오시는 길 섹션에 표시할 건물, 연습실 입구 또는 안내 사진입니다."
                disabled={disabled}
                folder="locations"
                label="오시는 길 대표 사진"
                onChange={(url) => updateValue('image_url', url ?? '')}
                value={values.image_url || null}
              />
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label>
                  <span className={labelClass()}>이미지 대체 텍스트</span>
                  <input
                    className={inputClass()}
                    onChange={(event) => updateValue('image_alt', event.target.value)}
                    placeholder="서울모테트음악재단 건물 입구"
                    value={values.image_alt}
                  />
                </label>
                <label>
                  <span className={labelClass()}>이미지 설명 선택 사항</span>
                  <input
                    className={inputClass()}
                    onChange={(event) => updateValue('image_caption', event.target.value)}
                    placeholder="방문 시 확인할 수 있는 짧은 안내"
                    value={values.image_caption}
                  />
                </label>
              </div>
            </div>

            <details className="rounded-formal border border-line-default bg-bg-ivory p-5">
              <summary className="cursor-pointer text-sm font-semibold text-navy-deep">
                지도 링크 직접 설정 선택 사항
              </summary>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-text-muted">
                <p>
                  일반적으로는 주소만 입력하면 충분합니다. 특정 장소 링크를 직접 연결하고 싶을 때만 네이버지도/카카오맵 URL을 입력하세요.
                </p>
                <p>
                  embed URL은 iframe 표시가 가능한 경우에만 사용됩니다. 일반 공유 링크는 iframe으로 표시되지 않을 수 있으며, 없어도 방문자 화면에는 지도 보기 버튼이 자동 표시됩니다.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <label>
                    <span className={labelClass()}>네이버지도 URL 선택 사항</span>
                    <input
                      className={inputClass()}
                      onChange={(event) => updateValue('naver_map_url', event.target.value)}
                      placeholder="https://map.naver.com 또는 https://naver.me"
                      type="url"
                      value={values.naver_map_url}
                    />
                  </label>
                  <label>
                    <span className={labelClass()}>카카오맵 URL 선택 사항</span>
                    <input
                      className={inputClass()}
                      onChange={(event) => updateValue('kakao_map_url', event.target.value)}
                      placeholder="https://map.kakao.com 또는 https://kko.to"
                      type="url"
                      value={values.kakao_map_url}
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className={labelClass()}>지도 embed URL 선택 사항</span>
                    <input
                      className={inputClass()}
                      onChange={(event) => updateValue('map_embed_url', event.target.value)}
                      placeholder="iframe 표시가 가능한 URL만 입력하세요."
                      type="url"
                      value={values.map_embed_url}
                    />
                  </label>
                </div>
              </div>
            </details>

            <AdminSwitch
              checked={values.is_visible}
              description="비공개로 바꾸면 방문자 화면에 오시는 길 정보가 표시되지 않습니다."
              label="공개 여부"
              name="is_visible"
              onChange={(checked) => updateValue('is_visible', checked)}
            />

            <div className="rounded-formal border border-line-default bg-bg-warm-white p-5">
              <p className="text-sm font-semibold text-navy-deep">지도 미리보기</p>
              <ul className="mt-3 grid gap-1 text-sm leading-6 text-text-muted">
                {statusMessages.map((message) => (
                  <li key={message}>- {message}</li>
                ))}
                {mapActions.status === 'buttons' ? (
                  <li>- 방문자 화면에서는 지도 버튼으로 안내됩니다.</li>
                ) : null}
              </ul>
              <div className="mt-5">
                <MapPreview
                  address={values.address}
                  embedUrl={values.map_embed_url}
                  kakaoMapUrl={values.kakao_map_url}
                  naverMapUrl={values.naver_map_url}
                  placeName={values.place_name || '지도 미리보기'}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button disabled={disabled} type="submit" variant="primary">
                {disabled ? '저장 중' : '저장'}
              </Button>
            </div>
    </form>
  )
}
