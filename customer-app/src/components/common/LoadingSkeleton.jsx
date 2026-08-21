import React from 'react'

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'restaurant') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-pulse flex flex-col justify-between"
          >
            <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'order' || type === 'report') {
    return (
      <div className="space-y-3.5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                </div>
              </div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-xl w-20" />
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-3xl bg-slate-100 dark:bg-slate-800/80 animate-pulse h-48 sm:h-56 w-full border border-slate-200/60 dark:border-slate-800"
        />
      ))}
    </div>
  )
}

export default LoadingSkeleton
