import React from 'react'
import { Inbox, ShoppingBag, UtensilsCrossed, RefreshCw } from 'lucide-react'
import Button from './Button'

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There is currently no data available to display.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-base font-extrabold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionText}
        </Button>
      )}
    </div>
  )
}

export default EmptyState

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

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded-md w-28" />
            <div className="h-4 bg-slate-200 rounded-md w-16" />
          </div>
          <div className="space-y-2 py-2">
            <div className="h-3 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded-lg w-20" />
            <div className="h-8 bg-slate-200 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-[#2845D6] border-blue-100',
    orange: 'bg-orange-50 text-[#F97316] border-orange-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{value}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${colors[color] || colors.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  )
}
