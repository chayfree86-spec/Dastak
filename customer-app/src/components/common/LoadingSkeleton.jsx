import React from 'react'

export const LoadingSkeleton = ({ count = 4, type = 'card' }) => {
  if (type === 'restaurant') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-pulse flex flex-col justify-between"
          >
            <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
            </div>
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
          className="rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse h-56 sm:h-64 w-full border border-slate-200/60 dark:border-slate-800"
        />
      ))}
    </div>
  )
}

export default LoadingSkeleton
