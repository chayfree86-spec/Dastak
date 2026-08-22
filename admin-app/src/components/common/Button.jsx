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
  const baseStyles = 'relative group overflow-hidden inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 outline-none focus:outline-none border-0 ring-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none cursor-pointer'

  const variants = {
    primary: 'bg-[#113BD0] hover:bg-[#F97316] text-white shadow-sm hover:shadow-md hover:shadow-orange-500/20',
    secondary: 'bg-slate-100 hover:bg-[#F97316] text-slate-800 dark:bg-slate-700/80 dark:text-slate-100 hover:text-white dark:hover:text-white',
    outline: 'bg-transparent hover:bg-[#F97316] text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 hover:border-[#F97316]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-[#F97316] text-slate-600 dark:text-slate-300 hover:text-white',
    accent: 'bg-[#F97316] hover:bg-[#113BD0] text-white shadow-sm hover:shadow-md hover:shadow-blue-500/20',
  }

  // Slide fill colors per variant
  const slideColors = {
    primary: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    secondary: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    outline: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    danger: 'bg-gradient-to-r from-rose-700 to-rose-800',
    ghost: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]',
    accent: 'bg-gradient-to-r from-[#113BD0] to-[#1E35B0]',
  }

  const sizes = {
    xs: 'min-h-[36px] px-3.5 py-2 text-xs gap-1.5 font-bold',
    sm: 'min-h-[40px] px-4 py-2.5 text-xs sm:text-sm gap-2 font-bold',
    md: 'min-h-[46px] px-5 py-3 text-sm gap-2.5 font-bold',
    lg: 'min-h-[52px] px-6 py-3.5 text-base gap-3 font-black',
    xl: 'min-h-[56px] px-7 py-4 text-base sm:text-lg gap-3 font-black w-full',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {/* Orange sliding fill layer on hover */}
      {!disabled && !loading && (
        <span
          className={`absolute inset-0 w-full h-full rounded-xl ${
            slideColors[variant] || slideColors.primary
          } -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0 pointer-events-none`}
        />
      )}

      {/* Button content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
        )}
        {children && <span className="truncate">{children}</span>}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </span>
    </button>
  )
}

export default Button
