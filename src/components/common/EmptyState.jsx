import React from 'react'
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react'
import Button from './Button'

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export const ErrorState = ({
  title = 'Unable to load data',
  message = 'A connection or server error occurred while retrieving data.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-1">{title}</h4>
      <p className="text-xs text-rose-700/80 dark:text-rose-300/70 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export default EmptyState
