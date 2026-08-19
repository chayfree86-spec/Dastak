import React, { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  icon: Icon,
  type = 'text',
  className = '',
  wrapperClassName = '',
  id,
  name,
  placeholder,
  disabled = false,
  value,
  onChange,
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6] disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${
            Icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2'
          } ${
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

Input.displayName = 'Input'
export default Input
