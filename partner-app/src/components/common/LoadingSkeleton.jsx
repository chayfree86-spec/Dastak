import React from 'react'

export const LoadingSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-1/2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4 mt-2" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-20" />
            <div className="flex gap-1.5">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LoadingSkeleton
