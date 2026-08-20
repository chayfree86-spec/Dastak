import React, { useState, useEffect, useRef, forwardRef } from 'react'
import { MapPin, Loader2, X, Search } from 'lucide-react'
import { fetchAddressSuggestions, forwardGeocodeAddress } from '../../utils/geocoding'
import { loadGoogleMaps } from '../../utils/googleMapsLoader'

export const AddressAutocomplete = forwardRef(({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Type address or landmark...',
  label,
  required = false,
  error,
  helperText,
  disabled = false,
  id,
  className = '',
  wrapperClassName = '',
  autoFocus = false,
}, ref) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize Google Maps in background
  useEffect(() => {
    loadGoogleMaps().catch(() => {})
  }, [])

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const text = e.target.value
    setQuery(text)
    if (onChange) onChange(e)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (!text || text.trim().length === 0) {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchAddressSuggestions(text)
        setSuggestions(results || [])
        setIsOpen((results && results.length > 0) || false)
        setActiveIndex(-1)
      } catch (err) {
        console.warn('Address suggestion fetch error:', err)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 250)
  }

  const handleSelectSuggestion = (item) => {
    const selectedText = item.formattedAddress || item.displayName || ''
    setQuery(selectedText)
    setIsOpen(false)
    setSuggestions([])
    setActiveIndex(-1)

    if (onChange) {
      onChange({ target: { value: selectedText, name: id } })
    }
    if (onSelect) {
      onSelect(item)
    }
  }

  // Force geocode if user pressed Enter on custom text
  const handleForceGeocode = async (textToGeocode) => {
    const target = textToGeocode || query
    if (!target || !target.trim()) return
    setLoading(true)
    try {
      const data = await forwardGeocodeAddress(target.trim())
      if (data && data.latitude && data.longitude) {
        handleSelectSuggestion(data)
      }
    } catch (e) {
      console.warn('Geocode lookup error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = async (e) => {
    if (e.key === 'ArrowDown' && isOpen && suggestions.length > 0) {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp' && isOpen && suggestions.length > 0) {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex])
      } else {
        setIsOpen(false)
        await handleForceGeocode(query)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    if (onChange) {
      onChange({ target: { value: '', name: id } })
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const inputId = id || `address-auto-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div ref={wrapperRef} className={`relative flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">Live search suggestions</span>
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
          <MapPin className="w-4 h-4 text-[#113BD0] dark:text-blue-400" />
        </div>

        <input
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed pl-9 pr-14 py-2 ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-700'
          } ${className}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-[#113BD0] dark:text-blue-400 animate-spin" />
          )}
          {!loading && query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}

      {/* Auto-suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 animate-in fade-in-50 duration-150">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
            <span>Location Suggestions</span>
            <span>Click to fetch map coordinates</span>
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={`${item.latitude}-${item.longitude}-${idx}`}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                activeIndex === idx
                  ? 'bg-[#113BD0]/10 dark:bg-blue-900/30 text-slate-900 dark:text-slate-100'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="mt-0.5 p-1 rounded-md bg-[#113BD0]/10 text-[#113BD0] dark:bg-blue-900/40 dark:text-blue-400 shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">
                  {item.formattedAddress || item.displayName}
                </p>
                {(item.city || item.state) && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {[item.city, item.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

AddressAutocomplete.displayName = 'AddressAutocomplete'
export default AddressAutocomplete
