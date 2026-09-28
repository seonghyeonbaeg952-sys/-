import { useState } from 'react'
import { useSampleLanguage } from './useSampleLanguage'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { changeDatePart, daysInMonth, ENGLISH_MONTHS, joinISODate, splitISODate, type DateParts } from './sampleDateModel'

type Props = { id: string; label: string; value: string; onChange: (value: string) => void; className?: string; required?: boolean; ariaInvalid?: boolean; ariaDescribedBy?: string; autoComplete?: string }

/** Native date controls follow the browser/OS locale even when lang="en".
 * Explicit English segments keep the ISO value and avoid an untranslated picker. */
function EnglishDateInput({ id, label, value, onChange, className, required = false, ariaInvalid, ariaDescribedBy }: Props) {
  const { copy: copyText } = useSiteEditor()
  const monthLabel = copyText('contact', 'contact.dateMonth', 'Month')
  const dayLabel = copyText('contact', 'contact.dateDay', 'Day')
  const yearLabel = copyText('contact', 'contact.dateYear', 'Year')
  const clearLabel = copyText('contact', 'contact.dateClear', 'Clear date')
  const [draft, setDraft] = useState(() => ({ source: value, parts: splitISODate(value) }))
  if (draft.source !== value) setDraft({ source: value, parts: splitISODate(value) })
  const parts = draft.source === value ? draft.parts : splitISODate(value)
  const isRequired = required || Object.values(parts).some(Boolean)
  const change = (key: keyof DateParts, next: string) => {
    const updated = changeDatePart(parts, key, next)
    const iso = joinISODate(updated)
    setDraft({ source: iso, parts: updated })
    onChange(iso)
  }
  return (
    <fieldset aria-label={label} aria-invalid={ariaInvalid || undefined} aria-describedby={ariaDescribedBy} className="sample-date-input" lang="en">
      <label>
        <span>{monthLabel}</span>
        <select autoComplete="bday-month" className={className} required={isRequired} value={parts.month} onChange={event => change('month', event.target.value)}>
          <option value="">{monthLabel}</option>
          {ENGLISH_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
        </select>
      </label>
      <label>
        <span>{dayLabel}</span>
        <select autoComplete="bday-day" className={className} required={isRequired} value={parts.day} onChange={event => change('day', event.target.value)}>
          <option value="">{dayLabel}</option>
          {Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
      <label htmlFor={id}>
        <span>{yearLabel}</span>
        <input aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid || undefined} autoComplete="bday-year" className={className} id={id} inputMode="numeric" maxLength={4} pattern="(?!0000)[0-9]{4}" placeholder={copyText('contact', 'contact.dateYearHint', 'YYYY')} required={isRequired} type="text" value={parts.year} onChange={event => change('year', event.target.value)} />
      </label>
      {Object.values(parts).some(Boolean) ? <button aria-label={`${clearLabel}: ${label}`} className="sample-date-input__clear" onClick={() => { setDraft({ source: '', parts: splitISODate('') }); onChange('') }} type="button">{clearLabel}</button> : null}
    </fieldset>
  )
}

export function SampleDateInput(props: Props) {
  const { enabled, language } = useSampleLanguage()
  return enabled && language === 'en' ? <EnglishDateInput {...props} /> : (
    <input aria-describedby={props.ariaDescribedBy} aria-invalid={props.ariaInvalid || undefined} autoComplete={props.autoComplete} className={props.className} id={props.id} onChange={event => props.onChange(event.target.value)} required={props.required || undefined} type="date" value={props.value} />
  )
}
