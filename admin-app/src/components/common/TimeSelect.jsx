import React from 'react'
import CustomSelect from './CustomSelect'

const pad = (n) => String(n).padStart(2, '0')

const to12h = (h) => {
  const period = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr} ${period}`
}

/**
 * Custom time picker (hour + minute dropdown lists) — replaces the native
 * <input type="time"> browser picker with an on-brand searchable list UI.
 * value/onChange use 'HH:mm'. Minutes step by 5.
 */
export const TimeSelect = ({ label, value = '09:00', onChange }) => {
  const [rawH = '09', rawM = '00'] = String(value || '09:00').split(':')
  const h = pad(parseInt(rawH, 10) || 0)
  const m = pad(parseInt(rawM, 10) || 0)

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: pad(i),
    label: `${pad(i)}  ·  ${to12h(i)}`,
  }))
  const minuteOptions = Array.from({ length: 12 }, (_, i) => ({
    value: pad(i * 5),
    label: `${pad(i * 5)} min`,
  }))

  const setHour = (nh) => onChange(`${nh}:${m}`)
  const setMinute = (nm) => onChange(`${h}:${nm}`)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <CustomSelect
          value={h}
          onChange={setHour}
          options={hourOptions}
          searchable
          placeholder="Hour"
        />
        <CustomSelect
          value={m}
          onChange={setMinute}
          options={minuteOptions}
          placeholder="Min"
        />
      </div>
    </div>
  )
}

export default TimeSelect
