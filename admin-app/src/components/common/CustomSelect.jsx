import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

export const CustomSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchable = false,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options

  const handleSelect = (val) => {
    onChange(val)
    setIsOpen(false)
    setSearchTerm('')
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
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 sm:h-10 flex items-center justify-between text-left text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6] disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-500'
            : isOpen
            ? 'border-[#2845D6]'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <span className={selectedOption ? 'font-medium' : 'text-slate-400 dark:text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-slate-400 text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                    opt.value === value
                      ? 'bg-[#2845D6]/10 text-[#2845D6] dark:bg-[#2845D6]/20 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
}

export default CustomSelect
