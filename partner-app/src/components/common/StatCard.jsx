import React from 'react'

export const StatCard = ({ title, value, change, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 border-blue-100 dark:border-blue-800/40',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] dark:text-orange-400 border-orange-100 dark:border-orange-800/40',
    green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/40',
  }

  const sub = change || subtitle

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-between gap-4 transition-all">
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
          {value}
        </h3>
        {sub && (
          <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate">
            {sub}
          </p>
        )}
      </div>
      {Icon && (
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
            colors[color] || colors.blue
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  )
}

export default StatCard
