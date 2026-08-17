import React from 'react'
import { Inbox, AlertCircle } from 'lucide-react'
import Button from './Button'

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Deliveries Found',
  description = 'You have no active or historical deliveries matching this filter.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-3 shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-400 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  )
}

export const ErrorState = ({
  title = 'Failed to Load',
  message = 'Unable to connect to server. Please check internet connection.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 sm:p-10 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center flex flex-col items-center justify-center gap-3 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200">{title}</h4>
        <p className="text-xs text-rose-600 dark:text-rose-400">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="dangerOutline"
          size="sm"
          onClick={onRetry}
          className="mt-1"
        >
          Retry Connection
        </Button>
      )}
    </div>
  )
}

export default EmptyState
