import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

export const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  error,
  helperText,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value) : new Date()))
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const handleSelectDay = (day) => {
    const selected = new Date(year, month, day)
    const formatted = selected.toISOString().split('T')[0]
    onChange(formatted)
    setIsOpen(false)
  }

  const isSelected = (day) => {
    if (!value) return false
    const d = new Date(value)
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  }

  const isToday = (day) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6] ${
          error ? 'border-rose-500' : isOpen ? 'border-[#2845D6]' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <span className={value ? 'font-medium' : 'text-slate-400 dark:text-slate-500'}>
          {value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-64 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-semibold text-slate-400">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="w-7 h-7" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const selected = isSelected(day)
              const today = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 text-xs font-medium rounded-lg flex items-center justify-center transition-colors ${
                    selected
                      ? 'bg-[#2845D6] text-white font-bold'
                      : today
                      ? 'bg-slate-100 dark:bg-slate-700 text-[#2845D6] dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {value && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="text-[11px] text-rose-500 hover:underline font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
}

export default DatePicker
