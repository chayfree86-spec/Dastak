import React from 'react'

export const Switch = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  activeColor = 'bg-emerald-500',
  className = '',
}) => {
  return (
    <div
      onClick={() => {
        if (!disabled && onChange) onChange(!checked)
      }}
      className={`flex items-center justify-between gap-3 select-none cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0 pr-2">
          {label && <p className="text-xs font-bold text-slate-800 leading-tight">{label}</p>}
          {description && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>}
        </div>
      )}
      <div
        className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
          checked ? activeColor : 'bg-slate-200'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  )
}

export default Switch
