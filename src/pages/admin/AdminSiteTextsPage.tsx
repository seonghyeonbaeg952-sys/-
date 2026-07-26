import { useEffect, useMemo, useRef, useState } from 'react'

import { AdminErrorState } from '../../components/admin/AdminErrorState'
import { AdminFormField } from '../../components/admin/AdminFormField'
import { AdminLoadingState } from '../../components/admin/AdminLoadingState'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { AdminTextarea } from '../../components/admin/AdminTextarea'
import {
  homeFieldDefinitions,
  homeFieldSections,
} from '../../components/admin/home/homeFieldDefinitions'
import { Button } from '../../components/common/Button'
import { getCurrentUser } from '../../lib/auth'
import { upsertSiteTextRows } from '../../lib/cms'
import { useCrudList } from '../../hooks/useCrudList'
import {
  invalidatePublicDataCache,
} from '../../hooks/usePublicData'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import type {
  HomeContentSectionId,
  HomeContentSiteTextDefinition,
} from '../../types/homeContent'

type HomeFieldValues = Record<string, string>

const FIXED_HOME_HERO_PREFIX = 'home.heroSupplement.'

const defaultValues: HomeFieldValues = Object.fromEntries(
  homeFieldDefinitions.map((definition) => [
    definition.key,
    definition.defaultValue,
  ]),
)

function getInputId(key: string) {
  return `home-field-${key.replace(/[^a-z0-9]+/gi, '-')}`
}

function normalizeAdminValue(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function createValuesFromRows(
  rows: Array<{ is_active: boolean; key: string; value: string | null }>,
) {
  const values = { ...defaultValues }

  for (const row of rows) {
    if (
      !row.is_active ||
      !(row.key in values) ||
      row.key.startsWith(FIXED_HOME_HERO_PREFIX)
    ) {
      continue
    }

    const value = normalizeAdminValue(row.value)
    if (value) {
      values[row.key] = value
    }
  }

  return values
}

function hasUnsafeText(value: string) {
  return [
    /<\s*\/?\s*[a-z][^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\bTODO\b/i,
    /placeholder/i,
    /undefined/i,
    /\bnull\b/i,
    /href\s*=\s*["']?#["']?/i,
  ].some((pattern) => pattern.test(value))
}

function validateField(
  definition: HomeContentSiteTextDefinition,
  value: string,
) {
  if (!value.trim()) {
    return '빈 값은 저장할 수 없습니다. 기본값 복원을 사용해 주세요.'
  }

  if (hasUnsafeText(value)) {
    return 'HTML, script, TODO, placeholder 같은 임시·위험 문구는 저장할 수 없습니다.'
  }

  if (
    definition.maxLength &&
    value.trim().length > definition.maxLength
  ) {
    return `${definition.maxLength}자 이내로 입력해 주세요.`
  }

  if (
    definition.inputType === 'boolean' &&
    !['true', 'false'].includes(value)
  ) {
    return '공개 여부 값이 올바르지 않습니다.'
  }

  if (definition.inputType === 'number') {
    const numberValue = Number.parseInt(value, 10)

    if (
      !Number.isFinite(numberValue) ||
      (definition.min !== undefined && numberValue < definition.min) ||
      (definition.max !== undefined && numberValue > definition.max)
    ) {
      return `${definition.min ?? 0}~${definition.max ?? '최대값'} 사이의 숫자를 입력해 주세요.`
    }
  }

  return null
}

function ManagedElsewhereLinks({
  sectionId,
}: {
  sectionId: HomeContentSectionId
}) {
  const section = homeFieldSections.find((item) => item.id === sectionId)

  if (!section?.managedElsewhere?.length) {
    return null
  }

  return (
    <aside className="rounded-formal border border-gold-warm/35 bg-gold-soft/20 p-4">
      <p className="text-sm font-semibold text-navy-deep">
        다른 메뉴에서 관리하는 실제 데이터
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {section.managedElsewhere.map((item) => (
          <a
            className="min-h-11 rounded-button border border-line-default bg-bg-warm-white px-4 py-3 transition hover:border-gold-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink"
            href={item.adminHref}
            key={`${sectionId}-${item.source}-${item.adminHref}`}
          >
            <strong className="block text-sm text-navy-deep">
              {item.label}
            </strong>
            <span className="mt-1 block text-xs leading-5 text-text-muted">
              {item.description}
            </span>
          </a>
        ))}
      </div>
    </aside>
  )
}

function HomeField({
  definition,
  error,
  onChange,
  value,
}: {
  definition: HomeContentSiteTextDefinition
  error?: string | null
  onChange: (value: string) => void
  value: string
}) {
  const id = getInputId(definition.key)
  const isFixedHeroReference = definition.sectionId === 'heroSupplement'

  if (definition.inputType === 'textarea') {
    return (
      <AdminTextarea
        description={definition.description}
        disabled={isFixedHeroReference}
        error={error}
        id={id}
        label={definition.label}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
      />
    )
  }

  if (definition.inputType === 'boolean') {
    const descriptionId = `${id}-description`
    return (
      <div>
        <span className="text-sm font-semibold text-navy-deep">
          {definition.label}
        </span>
        <p
          className="mt-1 text-xs leading-5 text-text-muted"
          id={descriptionId}
        >
          {definition.description}
        </p>
        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-button border border-line-default bg-bg-warm-white px-4">
          <input
            aria-describedby={descriptionId}
            checked={value === 'true'}
            className="size-5 accent-gold-warm"
            onChange={(event) =>
              onChange(event.target.checked ? 'true' : 'false')
            }
            type="checkbox"
          />
          <span className="text-sm text-navy-deep">
            {value === 'true' ? '공개' : '숨김'}
          </span>
        </label>
        {error ? (
          <p className="mt-2 text-sm text-state-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <AdminFormField
      description={definition.description}
      disabled={isFixedHeroReference}
      error={error}
      id={id}
      label={definition.label}
      max={definition.max}
      min={definition.min}
      onChange={(event) => onChange(event.target.value)}
      type={definition.inputType === 'number' ? 'number' : 'text'}
      value={value}
    />
  )
}

export function AdminSiteTextsPage() {
  const crud = useCrudList({
    order: { column: 'sort_order', ascending: true },
    table: 'site_texts',
  })
  const [values, setValues] = useState<HomeFieldValues>(defaultValues)
  const [initialValues, setInitialValues] =
    useState<HomeFieldValues>(defaultValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<
    Set<HomeContentSectionId>
  >(() => new Set([homeFieldSections[0].id]))
  const initializedRef = useRef(false)
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [initialValues, values],
  )

  useUnsavedChangesGuard({ enabled: isDirty })

  useEffect(() => {
    let isMounted = true

    void getCurrentUser().then((result) => {
      if (isMounted) {
        setCurrentUserId(result.data?.id ?? null)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (crud.isLoading || (initializedRef.current && isDirty)) {
      return
    }

    const nextValues = createValuesFromRows(crud.rows)
    setValues(nextValues)
    setInitialValues(nextValues)
    initializedRef.current = true
  }, [crud.isLoading, crud.rows, isDirty])

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }

      const next = { ...current }
      delete next[key]
      return next
    })
    setMessage(null)
    setSaveError(null)
  }

  const updateSectionOpenState = (
    sectionId: HomeContentSectionId,
    isOpen: boolean,
  ) => {
    setOpenSections((current) => {
      const next = new Set(current)

      if (isOpen) {
        next.add(sectionId)
      } else {
        next.delete(sectionId)
      }

      return next
    })
  }

  const resetSection = (sectionId: HomeContentSectionId) => {
    const section = homeFieldSections.find((item) => item.id === sectionId)

    if (
      !window.confirm(
        `${section?.title ?? '이 섹션'} 문구를 코드 기본값으로 되돌릴까요? 저장 전에는 public 화면에 반영되지 않습니다.`,
      )
    ) {
      return
    }

    setValues((current) => {
      const next = { ...current }
      for (const definition of homeFieldDefinitions) {
        if (definition.sectionId === sectionId) {
          next[definition.key] = definition.defaultValue
        }
      }
      return next
    })
    setMessage(null)
    setSaveError(null)
  }

  const restoreV2HtmlReferenceCopy = () => {
    if (
      !window.confirm(
        '홈 V2 HTML 기준 문구로 모든 홈 래퍼 문구를 복원할까요? 공연·공지·입단·미디어 같은 실제 데이터는 변경하지 않습니다.',
      )
    ) {
      return
    }

    setValues({ ...defaultValues })
    setErrors({})
    setMessage(null)
    setSaveError(null)
  }

  const save = async () => {
    const nextErrors: Record<string, string> = {}

    for (const definition of homeFieldDefinitions) {
      const error = validateField(
        definition,
        values[definition.key] ?? definition.defaultValue,
      )

      if (error) {
        nextErrors[definition.key] = error
      }
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSaveError('입력값을 확인해 주세요. 오류가 있는 필드로 이동해 수정할 수 있습니다.')
      const firstKey = Object.keys(nextErrors)[0]
      document.getElementById(getInputId(firstKey))?.focus()
      return
    }

    setIsSaving(true)
    setMessage(null)
    setSaveError(null)

    const payloads = homeFieldDefinitions.map((definition) => ({
      default_value: definition.defaultValue,
      description: definition.description,
      group_name: `home.${definition.sectionId}`,
      input_type:
        definition.inputType === 'textarea' ? 'textarea' : 'text',
      is_active: true,
      key: definition.key,
      label: definition.label,
      page: 'home',
      section: `home.${definition.sectionId}`,
      sort_order: definition.sortOrder,
      updated_by: currentUserId ?? undefined,
      value: values[definition.key].trim(),
      value_type:
        definition.inputType === 'textarea' ? 'textarea' : 'text',
    }))
    const result = await upsertSiteTextRows(payloads)

    setIsSaving(false)

    if (result.error) {
      setSaveError(result.error)
      return
    }

    const savedValues = { ...values }
    setInitialValues(savedValues)
    setMessage('홈 문구를 저장했습니다. 공개 홈 새로고침 후 반영 내용을 확인할 수 있습니다.')
    invalidatePublicDataCache()
    crud.reload()
  }

  return (
    <div className="space-y-7 pb-24">
      <AdminPageTitle
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/" target="_blank" variant="secondary">
              공개 홈 미리보기
            </Button>
            <Button
              disabled={isSaving}
              onClick={restoreV2HtmlReferenceCopy}
              variant="secondary"
            >
              V2 HTML 기준 복원
            </Button>
            <Button
              disabled={!isDirty || isSaving}
              onClick={() => void save()}
              variant="primary"
            >
              {isSaving ? '저장 중…' : '변경사항 저장'}
            </Button>
          </div>
        }
        description="공개 홈의 현재 섹션 순서대로 wrapper 문구를 관리합니다. 공연·입단·정신·미디어 같은 실제 데이터는 각 전용 메뉴가 소유합니다."
        title="홈 문구 관리 V2"
      />

      <div className="rounded-formal border border-line-default bg-bg-warm-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-navy-deep">
              저장 상태
            </p>
            <p className="mt-1 text-sm text-text-muted" role="status">
              {isDirty
                ? '저장하지 않은 변경사항이 있습니다.'
                : '저장된 내용과 일치합니다.'}
            </p>
          </div>
          <span
            className={`rounded-pill px-3 py-2 text-xs font-semibold ${
              isDirty
                ? 'bg-gold-soft/50 text-gold-ink'
                : 'bg-state-success/10 text-state-success'
            }`}
          >
            {isDirty ? '미저장' : '저장됨'}
          </span>
        </div>
        {message ? (
          <p className="mt-4 text-sm text-state-success" role="status">
            {message}
          </p>
        ) : null}
        {saveError ? (
          <p className="mt-4 text-sm text-state-error" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>

      {crud.isLoading ? <AdminLoadingState label="홈 문구를 불러오는 중입니다" /> : null}
      {crud.error && !crud.isLoading ? (
        <AdminErrorState
          action={
            <Button onClick={crud.reload} variant="secondary">
              다시 시도
            </Button>
          }
          description={crud.error}
        />
      ) : null}

      {!crud.isLoading && !crud.error
        ? homeFieldSections.map((section) => {
            const sectionFields = homeFieldDefinitions.filter(
              (definition) => definition.sectionId === section.id,
            )

            return (
              <details
                className="group rounded-formal border border-line-default bg-bg-warm-white shadow-sm"
                key={section.id}
                onToggle={(event) =>
                  updateSectionOpenState(section.id, event.currentTarget.open)
                }
                open={openSections.has(section.id)}
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink">
                  <span>
                    <span className="block text-base font-semibold text-navy-deep">
                      {String(section.publicOrder).padStart(2, '0')}.{' '}
                      {section.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-text-muted">
                      {section.description}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-xl text-gold-ink transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="space-y-6 border-t border-line-default px-5 py-6">
                  <ManagedElsewhereLinks sectionId={section.id} />
                  <div className="grid gap-6 lg:grid-cols-2">
                    {sectionFields.map((definition) => (
                      <HomeField
                        definition={definition}
                        error={errors[definition.key]}
                        key={definition.key}
                        onChange={(value) =>
                          updateValue(definition.key, value)
                        }
                        value={
                          values[definition.key] ?? definition.defaultValue
                        }
                      />
                    ))}
                  </div>
                  <div className="flex justify-end border-t border-line-default pt-5">
                    <Button
                      onClick={() => resetSection(section.id)}
                      size="sm"
                      variant="ghost"
                    >
                      이 섹션 기본값 복원
                    </Button>
                  </div>
                </div>
              </details>
            )
          })
        : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-default bg-bg-warm-white/95 p-3 shadow-[0_-8px_28px_rgb(16_35_63/0.12)] backdrop-blur md:left-[var(--admin-sidebar-width,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="hidden text-sm text-text-muted sm:block">
            {isDirty
              ? '변경사항을 저장해야 공개 홈에 반영됩니다.'
              : '모든 변경사항이 저장되었습니다.'}
          </p>
          <Button
            className="ml-auto w-full sm:w-auto"
            disabled={!isDirty || isSaving}
            onClick={() => void save()}
            variant="primary"
          >
            {isSaving ? '저장 중…' : '변경사항 저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}
