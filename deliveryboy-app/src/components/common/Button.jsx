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
    'relative group overflow-hidden inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 outline-none focus:outline-none border-0 ring-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none cursor-pointer tracking-tight'

  const variants = {
    primary:
      'bg-[#113BD0] hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/30',
    secondary:
      'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200',
    outline:
      'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-2xs',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20',
    dangerOutline:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/60',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
    accent:
      'bg-[#F97316] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20',
  }

  // Slide fill colors per variant (subtle and theme-aligned)
  const slideColors = {
    primary: 'bg-gradient-to-r from-blue-700 to-blue-800',
    secondary: 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-650',
    outline: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-750',
    success: 'bg-gradient-to-r from-emerald-700 to-emerald-800',
    danger: 'bg-gradient-to-r from-rose-700 to-rose-800',
    dangerOutline: 'bg-gradient-to-r from-rose-100 to-rose-200 dark:from-rose-900 dark:to-rose-850',
    ghost: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-750',
    accent: 'bg-gradient-to-r from-orange-600 to-orange-700',
  }

  const sizes = {
    xs: 'px-3.5 py-2 min-h-[36px] text-xs gap-1.5 font-bold',
    sm: 'px-4 py-2.5 min-h-[40px] text-xs sm:text-sm font-bold gap-2',
    md: 'px-5 py-3 min-h-[46px] text-sm font-bold gap-2.5',
    lg: 'px-6 py-3.5 min-h-[52px] text-base font-black gap-3',
    xl: 'px-7 py-4 min-h-[56px] text-base sm:text-lg font-black gap-3 w-full',
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
          className={`absolute inset-0 w-full h-full rounded-2xl ${
            slideColors[variant] || slideColors.primary
          } -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0 pointer-events-none`}
        />
      )}

      {/* Button Content Layer */}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
          </>
        )}
      </span>
    </button>
  )
}

export default Button
