import React from 'react'
import { RefreshCw } from 'lucide-react'
import Button from './Button'

export const ErrorState = ({
  title = 'Failed to Load',
  message = 'Unable to connect to server. Please check internet connection.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 sm:p-10 rounded-3xl bg-rose-50/50 border border-rose-200 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
        <RefreshCw className="w-6 h-6" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-extrabold text-rose-900">{title}</h4>
        <p className="text-xs text-rose-700/80">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-1">
          Retry
        </Button>
      )}
    </div>
  )
}

export default ErrorState
