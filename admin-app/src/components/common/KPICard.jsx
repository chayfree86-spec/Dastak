import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const KPICard = ({
  title,
  value,
  icon: Icon,
  comparison,
  comparisonLabel,
  color = 'blue',
  loading = false,
  onClick,
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-[#2845D6] dark:bg-blue-950/60 dark:text-blue-400',
    orange: 'bg-orange-50 text-[#F97316] dark:bg-orange-950/60 dark:text-orange-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
  }

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-[#2845D6]/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {value !== undefined && value !== null ? value : '-'}
        </div>

        {comparison !== undefined && comparison !== null && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {Number(comparison) >= 0 ? (
              <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{comparison}%
              </span>
            ) : (
              <span className="inline-flex items-center font-semibold text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {comparison}%
              </span>
            )}
            {comparisonLabel && (
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{comparisonLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
