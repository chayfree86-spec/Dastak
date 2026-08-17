import React from 'react'
import { Loader2 } from 'lucide-react'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'relative group overflow-hidden inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 outline-none focus:outline-none border-0 ring-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none cursor-pointer'

  const variants = {
    primary:
      'bg-[#2845D6] hover:bg-[#F97316] text-white shadow-sm hover:shadow-md hover:shadow-orange-500/20',
    secondary:
      'bg-slate-100 hover:bg-[#F97316] text-slate-800 hover:text-white',
    outline:
      'bg-white text-slate-700 border border-slate-200 hover:text-white hover:border-[#F97316] shadow-xs',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    dangerOutline:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:text-white hover:border-rose-600',
    ghost:
      'bg-transparent hover:bg-[#F97316] text-slate-600 hover:text-white',
    accent:
      'bg-[#F97316] hover:bg-[#2845D6] text-white shadow-sm hover:shadow-md hover:shadow-blue-500/20',
  }

  // Slide fill colors per variant
  const slideColors = {
    primary: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    secondary: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    outline: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    success: 'bg-gradient-to-r from-emerald-700 to-emerald-800',
    danger: 'bg-gradient-to-r from-rose-700 to-rose-800',
    dangerOutline: 'bg-gradient-to-r from-rose-600 to-rose-700',
    ghost: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    accent: 'bg-gradient-to-r from-[#2845D6] to-[#1E35B0]',
  }

  const sizes = {
    xs: 'px-2.5 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
    xl: 'px-6 py-3 text-base font-bold gap-3 w-full',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {/* Sliding fill layer on hover */}
      {!disabled && !loading && (
        <span
          className={`absolute inset-0 w-full h-full rounded-xl ${
            slideColors[variant] || slideColors.primary
          } -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0 pointer-events-none`}
        />
      )}

      {/* Button Content Layer (relative to stay above the sliding fill) */}
      <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            )}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && (
              <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            )}
          </>
        )}
      </span>
    </button>
  )
}

export default Button
