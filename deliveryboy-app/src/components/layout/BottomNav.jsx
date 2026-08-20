import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Package, DollarSign, MoreHorizontal, Bike } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const BottomNav = () => {
  const { activeOrder } = useAuth()

  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    {
      to: '/deliveries',
      label: 'Deliveries',
      icon: Package,
      badge: activeOrder ? '1' : null,
    },
    { to: '/earnings', label: 'Earnings', icon: DollarSign },
    { to: '/more', label: 'More', icon: MoreHorizontal },
  ]

  return (
    <nav aria-label="Rider Fleet Navigation" className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 pb-safe md:hidden shadow-lg">
      <div className="flex items-center justify-around px-1.5 sm:px-3 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              aria-label={`Navigate to ${item.label}${item.badge ? `, ${item.badge} active` : ''}`}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-2xl min-w-[56px] sm:min-w-[68px] transition-all touch-manipulation ${
                  isActive
                    ? 'text-[#113BD0] dark:text-blue-400 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F97316] text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#113BD0] dark:bg-blue-400 mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
