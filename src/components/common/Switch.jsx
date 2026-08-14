import React from 'react'

export const Switch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  return (
    <label className={`inline-flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative inline-flex items-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2845D6]"></div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>}
          {description && <span className="text-[11px] text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
      )}
    </label>
  )
}

export default Switch
