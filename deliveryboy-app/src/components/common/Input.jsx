import React from 'react'

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-2xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-white dark:bg-slate-900/90 border rounded-2xl px-4 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[42px] text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/20 focus:border-[#113BD0] dark:focus:border-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-11' : ''
          } ${error ? 'border-rose-300 dark:border-rose-500 ring-1 ring-rose-300 dark:ring-rose-500' : 'border-slate-200 dark:border-slate-700'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{error}</p>}
    </div>
  )
}

export default Input
