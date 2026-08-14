import React from 'react'

export const Skeleton = ({ className = '', count = 1 }) => {
  if (count === 1) {
    return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/80 rounded-lg ${className}`} />
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-slate-200 dark:bg-slate-700/80 rounded-lg ${className}`} />
      ))}
    </div>
  )
}

export default Skeleton
