import React from 'react'
import Button from './Button'

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm transition-colors duration-200">
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div className="space-y-1.5">
        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="md" icon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EmptyState
