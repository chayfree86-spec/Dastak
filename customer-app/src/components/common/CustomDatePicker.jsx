import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react'

export const CustomDatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  error,
  helperText,
  required = false,
  maxYear = new Date().getFullYear(),
  minYear = 1940,
  icon: Icon = CalendarIcon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  })
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const dropdownRef = useRef(null)

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) setViewDate(d)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsYearPickerOpen(false)
        setIsMonthPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const totalDays = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const prevMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const nextMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day) => {
    const selected = new Date(year, month, day)
    const y = selected.getFullYear()
    const m = String(selected.getMonth() + 1).padStart(2, '0')
    const d = String(selected.getDate()).padStart(2, '0')
    const formatted = `${y}-${m}-${d}`
    onChange(formatted)
    setIsOpen(false)
    setIsYearPickerOpen(false)
    setIsMonthPickerOpen(false)
  }

  const handleSelectYear = (y) => {
    setViewDate(new Date(y, month, 1))
    setIsYearPickerOpen(false)
  }

  const handleSelectMonth = (mIdx) => {
    setViewDate(new Date(year, mIdx, 1))
    setIsMonthPickerOpen(false)
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

  // Generate Year list in reverse order (e.g. 2026, 2025 ... 1940)
  const years = []
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y)
  }

  const formattedDisplayValue = value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <div className={`flex flex-col gap-1 relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
        </label>
      )}

      {/* Input Trigger Box */}
      <div
        onClick={() => {
          setIsOpen(!isOpen)
          setIsYearPickerOpen(false)
          setIsMonthPickerOpen(false)
        }}
        className={`w-full h-11 px-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800 flex items-center justify-between cursor-pointer select-none transition-all ${
          isOpen
            ? 'border-[#113BD0] ring-2 ring-[#113BD0]/20 bg-white dark:bg-slate-800'
            : error
            ? 'border-rose-400 bg-rose-50/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        <span
          className={`text-xs sm:text-sm font-medium truncate ${
            formattedDisplayValue
              ? 'text-slate-900 dark:text-slate-100 font-bold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {formattedDisplayValue || placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <CalendarIcon className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Custom Theme Popup Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Navigation & Year/Month Pickers */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Quick Month & Year Dropdown Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsMonthPickerOpen(!isMonthPickerOpen)
                  setIsYearPickerOpen(false)
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{monthNames[month]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsYearPickerOpen(!isYearPickerOpen)
                  setIsMonthPickerOpen(false)
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-black text-[#113BD0] dark:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{year}</span>
                <ChevronDown className="w-3 h-3 text-[#113BD0] dark:text-blue-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subview: Month Grid Selector */}
          {isMonthPickerOpen ? (
            <div className="grid grid-cols-3 gap-2 py-2">
              {monthShortNames.map((mName, idx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    idx === month
                      ? 'bg-[#113BD0] text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {mName}
                </button>
              ))}
            </div>
          ) : isYearPickerOpen ? (
            /* Subview: Year Scroll List */
            <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-1.5 py-1 scrollbar-thin">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleSelectYear(y)}
                  className={`h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    y === year
                      ? 'bg-[#113BD0] text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            /* Main Calendar Grid */
            <>
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="text-[11px] font-black text-slate-400 select-none">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
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
                      className={`w-8 h-8 sm:w-9 sm:h-9 text-xs rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                        selected
                          ? 'bg-gradient-to-tr from-[#113BD0] to-[#1E3A8A] text-white shadow-md shadow-blue-500/30'
                          : today
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                const y = now.getFullYear()
                const m = String(now.getMonth() + 1).padStart(2, '0')
                const d = String(now.getDate()).padStart(2, '0')
                onChange(`${y}-${m}-${d}`)
                setIsOpen(false)
              }}
              className="text-[#113BD0] dark:text-blue-400 hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  )
}

export default CustomDatePicker
