import React, { forwardRef } from 'react'

export const AmountInput = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  className = '',
  wrapperClassName = '',
  id,
  name,
  placeholder = '0.00',
  disabled = false,
  value,
  onChange,
  ...props
}, ref) => {
  const inputId = id || name || `amount-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <div className="absolute left-3 font-semibold text-slate-500 dark:text-slate-400 pointer-events-none select-none text-sm">
          ₹
        </div>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full h-11 sm:h-10 text-sm font-medium rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-8 pr-3.5 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0] disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-700'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  )
})

AmountInput.displayName = 'AmountInput'
export default AmountInput
