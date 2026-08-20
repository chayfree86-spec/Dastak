import React from 'react'

export const Tabs = ({ tabs = [], activeTab, onChange, className = '', variant = 'pills' }) => {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-slate-200 dark:border-slate-700 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar ${className}`}>
        <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                  isActive
                    ? 'border-[#113BD0] text-[#113BD0] dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-[11px] rounded-full font-bold ${
                      isActive
                        ? 'bg-[#113BD0]/15 text-[#113BD0] dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  // Default 'pills'
  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-2xl sm:rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar max-w-full select-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 h-10 sm:h-8 rounded-xl sm:rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-[#113BD0] dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive
                    ? 'bg-[#113BD0]/15 text-[#113BD0] dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
