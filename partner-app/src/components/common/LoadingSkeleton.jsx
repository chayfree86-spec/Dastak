import React from 'react'

export const LoadingSkeleton = ({ count = 3 }) => {
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

export default LoadingSkeleton
