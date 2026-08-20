import React from 'react'
import { Check, Clock, CircleDot, X } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'

export const Timeline = ({ steps = [], className = '' }) => {
  return (
    <div className={`space-y-6 relative ${className}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'
        const isCancelled = step.status === 'cancelled'

        return (
          <div key={idx} className="relative flex items-start gap-4">
            {/* Connecting vertical line */}
            {!isLast && (
              <span
                className={`absolute top-6 left-3.5 -ml-px h-full w-0.5 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCancelled
                    ? 'bg-rose-400'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
                aria-hidden="true"
              />
            )}

            {/* Icon Marker */}
            <div
              className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors ${
                isCompleted
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                  : isCancelled
                  ? 'bg-rose-500 text-white ring-4 ring-rose-50 dark:ring-rose-950/40'
                  : isCurrent
                  ? 'bg-[#113BD0] text-white ring-4 ring-blue-100 dark:ring-blue-950/50 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : isCancelled ? (
                <X className="w-3.5 h-3.5 stroke-[3]" />
              ) : isCurrent ? (
                <CircleDot className="w-4 h-4" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Step Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h5
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-[#113BD0] dark:text-blue-400'
                      : isCompleted
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.title}
                </h5>
                {step.timestamp && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {formatDateTime(step.timestamp)}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Timeline
