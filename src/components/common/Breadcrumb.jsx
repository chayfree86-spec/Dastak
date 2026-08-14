import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumb = ({ items = [], className = '' }) => {
  return (
    <nav className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`} aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`font-semibold ${isLast ? 'text-slate-900 dark:text-slate-100' : ''}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
