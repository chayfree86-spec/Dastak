import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  Users,
  Wallet,
  Tag,
  BarChart3,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { hasPermission } from '../../utils/permissions'

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD' },
  { label: 'Orders', path: '/orders', icon: ShoppingBag, permission: 'ORDERS' },
  { label: 'Restaurants', path: '/restaurants', icon: Store, permission: 'RESTAURANTS' },
  { label: 'Delivery Boys', path: '/delivery-boys', icon: Bike, permission: 'DELIVERY_BOYS' },
  { label: 'Customers', path: '/customers', icon: Users, permission: 'CUSTOMERS' },
  { label: 'Finance', path: '/finance', icon: Wallet, permission: 'FINANCE' },
  { label: 'Marketing', path: '/marketing', icon: Tag, permission: 'MARKETING' },
  { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'REPORTS' },
  { label: 'Support', path: '/support', icon: HelpCircle, permission: 'SUPPORT' },
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'SETTINGS' },
]

export const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const location = useLocation()

  const allowedNavItems = navigationItems.filter((item) => hasPermission(user?.role, item.permission))

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={isDark ? '/logo-dark.png' : '/logo-light.png'}
              alt="Dastak Logo"
              className="h-9 w-auto object-contain shrink-0"
              onError={(e) => {
                // Fallback icon if logo image fails to load
                e.target.style.display = 'none'
              }}
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                  Dastak
                </span>
                <span className="text-[10px] font-semibold text-[#F97316] uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => mobileOpen && onCloseMobile()}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-[#2845D6] text-white shadow-sm shadow-[#2845D6]/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </div>

        {/* Footer Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800">
          {!collapsed && (
            <div className="text-[11px] text-slate-400 font-medium px-2">
              v1.0.0 &bull; Operational
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
