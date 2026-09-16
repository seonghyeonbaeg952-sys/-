import { useEffect, useRef, useState } from 'react'
import { loadIntakeLimits, saveIntakeLimit, type IntakeLimit } from '../../lib/intakeLimits'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import type { CmsMutationPayload } from '../../types/cms'
import { Button } from '../common/Button'
import { AdminRecordForm, type AdminFieldConfig } from './AdminRecordForm'

const labels = { contact: '문의 접수', pledge: '후원약정 접수', join: '입단지원서 접수' }
const fields = [
  { name: 'hourly_total', label: '한 시간 전체 접수', type: 'number', required: true, description: '10–10,000건 · 기본값 100건' },
  { name: 'hourly_contact', label: '한 시간 동일 연락처 접수', type: 'number', required: true, description: '1–100건 · 기본값 5건 · 전체 접수 제한 이하' },
] satisfies AdminFieldConfig<{ id: string; hourly_total: number; hourly_contact: number }>[]

export function AdminIntakeLimits() {
  const [opened, setOpened] = useState(false)
  const [reload, setReload] = useState(0)
  const [rows, setRows] = useState<IntakeLimit[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<IntakeLimit['kind'] | null>(null)
  const [messages, setMessages] = useState<Partial<Record<IntakeLimit['kind'], { text: string; failed: boolean }>>>({})
  const [dirty, setDirty] = useState<Partial<Record<IntakeLimit['kind'], boolean>>>({})
  const lock = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useUnsavedChangesGuard({ enabled: Boolean(saving) || Object.values(dirty).some(Boolean) })
  useEffect(() => {
    if (!opened) return
    let active = true
    void loadIntakeLimits().then(result => {
      if (!active) return
      setRows(result.data); setError(result.error); setLoading(false)
    })
    return () => { active = false }
  }, [opened, reload])
  const save = async (row: IntakeLimit, payload: CmsMutationPayload) => {
    if (lock.current) return false
    lock.current = true; setSaving(row.kind); setMessages(current => ({ ...current, [row.kind]: undefined }))
    try {
      const result = await saveIntakeLimit(row, { hourly_total: payload.hourly_total, hourly_contact: payload.hourly_contact })
      if (!mounted.current) return false
      if (!result.data) { setMessages(current => ({ ...current, [row.kind]: { text: result.error, failed: true } })); return false }
      setRows(current => current?.map(item => item.kind === row.kind ? result.data : item) ?? null)
      setMessages(current => ({ ...current, [row.kind]: { text: `${labels[row.kind]} 보호 설정을 저장했습니다. 기존 접수 내용은 바뀌지 않습니다.`, failed: false } }))
      return true
    } finally { lock.current = false; if (mounted.current) setSaving(null) }
  }
  return <details className="border-t border-line-default pt-5" onToggle={event => { if (event.currentTarget.open) setOpened(true) }}>
    <summary className="min-h-11 cursor-pointer py-3 font-semibold">접수 보호 설정 · 고급</summary>
    <p className="my-4 text-sm leading-7 text-text-muted">짧은 시간에 너무 많은 접수가 몰릴 때 적용되는 제한입니다. 값을 낮추면 정상적인 새 접수도 잠시 제한될 수 있습니다. 동일 연락처는 문의·약정의 이메일, 지원서의 지원자 전화번호를 기준으로 하며, 본인인증이나 네트워크 공격 차단을 대신하지 않습니다. 문제가 없다면 현재값을 유지하세요.</p>
    {opened && loading ? <p role="status">접수 보호 설정을 확인하고 있습니다.</p> : null}
    {error ? <div role="alert"><p>{error}</p><Button variant="secondary" disabled={loading} onClick={() => { setLoading(true); setReload(value => value + 1) }}>다시 확인</Button></div> : null}
    {rows?.map(row => <section className="mb-6 border-t border-line-default pt-5" key={row.kind} aria-label={labels[row.kind]}>
      <h2 className="mb-4 font-semibold">{labels[row.kind]}</h2>
      {messages[row.kind] ? <p className="mb-3 text-sm" role={messages[row.kind]?.failed ? 'alert' : 'status'}>{messages[row.kind]?.text}</p> : null}
      <AdminRecordForm fields={fields} initialData={{ id: row.kind, hourly_total: row.hourly_total, hourly_contact: row.hourly_contact }}
        disabled={saving !== null} submitLabel={`${labels[row.kind]} 제한 저장`} onSubmit={payload => save(row, payload)}
        onDirtyChange={value => setDirty(current => current[row.kind] === value ? current : { ...current, [row.kind]: value })} />
    </section>)}
  </details>
}
