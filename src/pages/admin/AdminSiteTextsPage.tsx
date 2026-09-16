import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { AdminErrorState } from '../../components/admin/AdminErrorState'
import { AdminFormField } from '../../components/admin/AdminFormField'
import { AdminLoadingState } from '../../components/admin/AdminLoadingState'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { AdminTextarea } from '../../components/admin/AdminTextarea'
import { homeFieldSections } from '../../components/admin/home/homeFieldDefinitions'
import { HomeDevicePreview } from '../../components/admin/home/HomeDevicePreview'
import {
  acceptHomeDeviceSubmission,
  captureHomeDeviceSubmission,
  createHomeEditorDraft,
  getHomeEditorDirtyKeys,
  homeEditorDevices,
  reconcileHomeEditorDraft,
  restoreHomeEditorFields,
  updateHomeEditorDraft,
  validateHomeEditorField,
} from '../../components/admin/home/homeDeviceEditorModel'
import { Button } from '../../components/common/Button'
import { getCurrentUser } from '../../lib/auth'
import { upsertSiteTextRows } from '../../lib/cms'
import {
  createHomeEditorValues,
  getHomeEditorFields,
  homeAllEditorFields,
  type HomeEditorDevice,
} from '../../lib/homeDeviceContent'
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

const defaultValues = createHomeEditorValues({})

function getInputId(key: string) {
  return `home-field-${key.replace(/[^a-z0-9]+/gi, '-')}`
}

function normalizeAdminValue(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function createValuesFromRows(
  rows: Array<{ is_active: boolean; key: string; value: string | null }>,
) {
  const activeRawFlat: HomeFieldValues = Object.fromEntries(rows
    .filter((row) => row.is_active)
    .map((row) => [row.key, normalizeAdminValue(row.value)]))
  return createHomeEditorValues(activeRawFlat)
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
  if (definition.inputType === 'textarea') {
    return (
      <AdminTextarea
        description={definition.description}
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
    const errorId = error ? `${id}-error` : undefined
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
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ')}
            aria-invalid={Boolean(error) || undefined}
            aria-label={definition.label}
            checked={value === 'true'}
            className="size-5 accent-gold-warm"
            id={id}
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
          <p className="mt-2 text-sm text-state-error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <AdminFormField
      description={definition.description}
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
  const [editor, setEditor] = useState(() => createHomeEditorDraft(defaultValues))
  const [device, setDevice] = useState<HomeEditorDevice>('mobile')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savingDevice, setSavingDevice] = useState<HomeEditorDevice | null>(null)
  const [messages, setMessages] = useState<Record<HomeEditorDevice, string | null>>({ desktop: null, tablet: null, mobile: null })
  const [saveErrors, setSaveErrors] = useState<Record<HomeEditorDevice, string | null>>({ desktop: null, tablet: null, mobile: null })
  const [previewVersion, setPreviewVersion] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<HomeEditorDevice, Set<HomeContentSectionId>>>(() => Object.fromEntries(
    homeEditorDevices.map((item) => {
      const fields = getHomeEditorFields(item.id)
      const first = homeFieldSections.find((section) => fields.some((field) => field.sectionId === section.id))
      return [item.id, new Set(first ? [first.id] : [])]
    }),
  ) as Record<HomeEditorDevice, Set<HomeContentSectionId>>)
  const initializedRef = useRef(false)
  const loadedRowsRef = useRef<typeof crud.rows | null>(null)
  const savingRef = useRef(false)
  const fields = useMemo(() => getHomeEditorFields(device), [device])
  const dirtyKeys = useMemo(() => getHomeEditorDirtyKeys(editor, homeAllEditorFields), [editor])
  const dirtyByDevice = useMemo(() => ({
    desktop: getHomeEditorDirtyKeys(editor, getHomeEditorFields('desktop')),
    tablet: getHomeEditorDirtyKeys(editor, getHomeEditorFields('tablet')),
    mobile: getHomeEditorDirtyKeys(editor, getHomeEditorFields('mobile')),
  }), [editor])
  const activeDirtyKeys = dirtyByDevice[device]
  const isDirty = dirtyKeys.length > 0
  const activeDirty = activeDirtyKeys.length > 0
  const isSaving = savingDevice !== null
  const deviceLabel = homeEditorDevices.find((item) => item.id === device)?.label ?? '모바일'
  const message = messages[device]
  const saveError = saveErrors[device]
  const saveLabel = savingDevice === device ? `${deviceLabel} 저장 중…` : `${deviceLabel} 변경사항 저장`

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
    if (crud.isLoading || crud.error || loadedRowsRef.current === crud.rows) {
      return
    }

    const nextValues = createValuesFromRows(crud.rows)
    loadedRowsRef.current = crud.rows
    const wasInitialized = initializedRef.current
    setEditor((current) => wasInitialized
      ? reconcileHomeEditorDraft(current, nextValues)
      : createHomeEditorDraft(nextValues))
    initializedRef.current = true
    setIsInitialized(true)
  }, [crud.error, crud.isLoading, crud.rows])

  const updateValue = (key: string, value: string) => {
    setEditor((current) => updateHomeEditorDraft(current, key, value))
    setErrors((current) => {
      if (!current[key]) {
        return current
      }

      const next = { ...current }
      delete next[key]
      return next
    })
    setMessages((current) => ({ ...current, [device]: null }))
    setSaveErrors((current) => ({ ...current, [device]: null }))
  }

  const handleDeviceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = homeEditorDevices.findIndex((item) => item.id === device)
    let nextIndex: number
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % homeEditorDevices.length
    else if (event.key === 'ArrowLeft') nextIndex = (index + homeEditorDevices.length - 1) % homeEditorDevices.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = homeEditorDevices.length - 1
    else return
    event.preventDefault()
    const nextDevice = homeEditorDevices[nextIndex].id
    setDevice(nextDevice)
    document.getElementById(`home-cms-tab-${nextDevice}`)?.focus()
  }

  const updateSectionOpenState = (
    sectionId: HomeContentSectionId,
    isOpen: boolean,
  ) => {
    setOpenSections((current) => {
      if (current[device].has(sectionId) === isOpen) return current
      const next = new Set(current[device])

      if (isOpen) {
        next.add(sectionId)
      } else {
        next.delete(sectionId)
      }

      return { ...current, [device]: next }
    })
  }

  const resetSection = (sectionId: HomeContentSectionId) => {
    const section = homeFieldSections.find((item) => item.id === sectionId)

    if (
      !window.confirm(
        `${deviceLabel} 홈의 ${section?.title ?? '이 섹션'} 문구를 기본값으로 되돌릴까요? 저장 전에는 공개 홈에 반영되지 않습니다.`,
      )
    ) {
      return
    }

    const sectionFields = fields.filter((field) => field.sectionId === sectionId)
    setEditor((current) => restoreHomeEditorFields(current, sectionFields))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !sectionFields.some((field) => field.key === key))))
    setMessages((current) => ({ ...current, [device]: null }))
    setSaveErrors((current) => ({ ...current, [device]: null }))
  }

  const restoreCurrentHomeCopy = () => {
    if (
      !window.confirm(
        `${deviceLabel} 홈 문구만 기본값으로 복원할까요? 다른 기기의 문구와 공연·공지·입단·미디어 데이터는 변경하지 않습니다.`,
      )
    ) {
      return
    }

    setEditor((current) => restoreHomeEditorFields(current, fields))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !fields.some((field) => field.key === key))))
    setMessages((current) => ({ ...current, [device]: null }))
    setSaveErrors((current) => ({ ...current, [device]: null }))
  }

  const save = async () => {
    if (savingRef.current || !activeDirty || !initializedRef.current) return
    const submittedDevice = device
    const submittedLabel = deviceLabel
    try {
      const submission = captureHomeDeviceSubmission(editor, submittedDevice, fields)
      const changedFields = fields.filter((field) => Object.hasOwn(submission.persistedValues, field.key))
      if (changedFields.length === 0) return
      const nextErrors: Record<string, string> = {}
      for (const definition of changedFields) {
        const error = validateHomeEditorField(definition, submission.persistedValues[definition.key])
        if (error) nextErrors[definition.key] = error
      }
      setErrors((current) => ({
        ...Object.fromEntries(Object.entries(current).filter(([key]) => !fields.some((field) => field.key === key))),
        ...nextErrors,
      }))
      if (Object.keys(nextErrors).length > 0) {
        setSaveErrors((current) => ({ ...current, [submittedDevice]: `${submittedLabel} 입력값을 확인해 주세요.` }))
        setOpenSections((current) => ({ ...current, [submittedDevice]: new Set([
          ...current[submittedDevice],
          ...changedFields.filter((field) => nextErrors[field.key]).map((field) => field.sectionId),
        ]) }))
        window.requestAnimationFrame(() => document.getElementById(getInputId(Object.keys(nextErrors)[0]))?.focus())
        return
      }
      savingRef.current = true
      setSavingDevice(submittedDevice)
      setMessages((current) => ({ ...current, [submittedDevice]: null }))
      setSaveErrors((current) => ({ ...current, [submittedDevice]: null }))
      const payloads = changedFields.map((definition) => {
        const group = submittedDevice === 'desktop' ? `home.${definition.sectionId}` : `home.${submittedDevice}.${definition.sectionId}`
        return {
          default_value: definition.defaultValue,
          description: definition.description,
          group_name: group,
          input_type: definition.inputType === 'textarea' ? 'textarea' : 'text',
          is_active: true,
          key: definition.key,
          label: definition.label,
          page: 'home',
          section: group,
          sort_order: definition.sortOrder,
          updated_by: currentUserId ?? undefined,
          value: submission.persistedValues[definition.key],
          value_type: definition.inputType === 'textarea' ? 'textarea' : 'text',
        }
      })
      const result = await upsertSiteTextRows(payloads)
      if (result.error) {
        setSaveErrors((current) => ({ ...current, [submittedDevice]: result.error }))
        return
      }
      setEditor((current) => acceptHomeDeviceSubmission(current, submission))
      setMessages((current) => ({ ...current, [submittedDevice]: `${submittedLabel} 홈 문구 ${changedFields.length}개를 저장했습니다.` }))
      invalidatePublicDataCache()
      setPreviewVersion((current) => current + 1)
      crud.reload()
    } catch (error) {
      setSaveErrors((current) => ({ ...current, [submittedDevice]: error instanceof Error ? error.message : '저장하지 못했습니다. 입력한 문구는 유지됩니다. 다시 시도해 주세요.' }))
    } finally {
      savingRef.current = false
      setSavingDevice(null)
    }
  }

  return (
    <div className="space-y-7 pb-24">
      <AdminPageTitle
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/" target="_blank" variant="secondary">
              공개 홈 새 탭으로 보기
            </Button>
            <Button
              disabled={isSaving || !isInitialized}
              onClick={restoreCurrentHomeCopy}
              variant="secondary"
            >
              {deviceLabel} 기본값 복원
            </Button>
            <Button
              disabled={!activeDirty || isSaving || !isInitialized}
              onClick={() => void save()}
              variant="primary"
            >
              {saveLabel}
            </Button>
          </div>
        }
        description="기기를 선택해 해당 화면의 홈 문구를 관리합니다. 기기별로 초안과 저장이 분리되며, 공연·입단·미디어의 실제 데이터는 각 전용 메뉴에서 공통으로 관리합니다."
        title="홈 CMS · 화면별 문구"
      />

      <div aria-label="홈 편집 화면" className="grid grid-cols-3 gap-2" onKeyDown={handleDeviceKeyDown} role="tablist">
        {homeEditorDevices.map((item) => (
          <button
            aria-controls="home-cms-editor-panel"
            aria-selected={device === item.id}
            className={`min-h-16 rounded-button border px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink ${device === item.id ? 'border-navy-deep bg-navy-deep text-bg-warm-white' : 'border-line-default bg-bg-warm-white text-navy-deep'}`}
            id={`home-cms-tab-${item.id}`}
            key={item.id}
            onClick={() => setDevice(item.id)}
            role="tab"
            tabIndex={device === item.id ? 0 : -1}
            type="button"
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-1 block text-xs">
              {item.width}px{dirtyByDevice[item.id].length ? ` · 미저장 ${dirtyByDevice[item.id].length}개` : ' · 저장됨'}
              {saveErrors[item.id] ? ' · 저장 확인 필요' : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-formal border border-line-default bg-bg-warm-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-navy-deep">
              {deviceLabel} 저장 상태
            </p>
            <p className="mt-1 text-sm text-text-muted" role="status">
              {activeDirty
                ? `저장하지 않은 ${deviceLabel} 문구가 ${activeDirtyKeys.length}개 있습니다.`
                : `${deviceLabel} 문구는 저장된 내용과 일치합니다.`}
            </p>
          </div>
          <span
            className={`rounded-pill px-3 py-2 text-xs font-semibold ${
              activeDirty
                ? 'bg-gold-soft/50 text-gold-ink'
                : 'bg-state-success/10 text-state-success'
            }`}
          >
            {activeDirty ? '미저장' : '저장됨'}
          </span>
        </div>
        {dirtyKeys.length > activeDirtyKeys.length ? (
          <p className="mt-3 text-xs leading-6 text-text-muted">다른 기기의 미저장 초안도 유지되고 있습니다. 해당 탭에서 따로 저장해 주세요.</p>
        ) : null}
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

      <HomeDevicePreview device={device} refreshVersion={previewVersion} />

      {crud.isLoading && !isInitialized ? <AdminLoadingState label="홈 문구를 불러오는 중입니다" /> : null}
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

      <div aria-labelledby={`home-cms-tab-${device}`} className="space-y-6" id="home-cms-editor-panel" role="tabpanel" tabIndex={0}>
      {isInitialized
        ? homeFieldSections.filter((section) => fields.some((field) => field.sectionId === section.id)).map((section) => {
            const sectionFields = fields.filter(
              (definition) => definition.sectionId === section.id,
            )

            return (
              <details
                className="group rounded-formal border border-line-default bg-bg-warm-white shadow-sm"
                key={`${device}-${section.id}`}
                onToggle={(event) =>
                  updateSectionOpenState(section.id, event.currentTarget.open)
                }
                open={openSections[device].has(section.id)}
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
                          editor.values[definition.key] ?? definition.defaultValue
                        }
                      />
                    ))}
                  </div>
                  <div className="flex justify-end border-t border-line-default pt-5">
                    <Button
                      disabled={isSaving}
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
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-default bg-bg-warm-white/95 p-3 shadow-[0_-8px_28px_rgb(16_35_63/0.12)] backdrop-blur md:left-[var(--admin-sidebar-width,0px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="hidden text-sm text-text-muted sm:block">
            {activeDirty
              ? `${deviceLabel} 문구만 저장합니다. 다른 기기의 초안은 유지됩니다.`
              : `${deviceLabel}의 저장할 변경사항이 없습니다.`}
          </p>
          <Button
            className="ml-auto w-full sm:w-auto"
            disabled={!activeDirty || isSaving || !isInitialized}
            onClick={() => void save()}
            variant="primary"
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
