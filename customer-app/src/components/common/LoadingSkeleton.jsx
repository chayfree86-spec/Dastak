import React from 'react'

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-750 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-750 rounded-md w-3/4" />
              <div className="h-3 bg-slate-150 dark:bg-slate-800 rounded-md w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
