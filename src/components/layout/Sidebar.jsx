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
  Sun,
  Moon,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { hasPermission, ROLE_LABELS } from '../../utils/permissions'

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'DASHBOARD', color: 'bg-blue-50 dark:bg-blue-950/60 text-[#2845D6] dark:text-blue-400' },
  { label: 'Orders', path: '/orders', icon: ShoppingBag, permission: 'ORDERS', color: 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' },
  { label: 'Restaurants', path: '/restaurants', icon: Store, permission: 'RESTAURANTS', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' },
  { label: 'Delivery Boys', path: '/delivery-boys', icon: Bike, permission: 'DELIVERY_BOYS', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' },
  { label: 'Customers', path: '/customers', icon: Users, permission: 'CUSTOMERS', color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' },
  { label: 'Finance', path: '/finance', icon: Wallet, permission: 'FINANCE', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' },
  { label: 'Marketing', path: '/marketing', icon: Tag, permission: 'MARKETING', color: 'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400' },
  { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'REPORTS', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' },
  { label: 'Support', path: '/support', icon: HelpCircle, permission: 'SUPPORT', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' },
  { label: 'Settings', path: '/settings', icon: Settings, permission: 'SETTINGS', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
]

export const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const allowedNavItems = navigationItems.filter((item) => hasPermission(user?.role, item.permission))

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR (Preserved Exactly for Large Screens) */}
      {/* ======================================================== */}
      <aside
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak Logo"
              className="h-8 max-h-8 w-auto object-contain shrink-0"
              style={{ height: '32px', maxHeight: '32px', width: 'auto' }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
          </div>
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
        <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800">
          {!collapsed && (
            <div className="text-[11px] text-slate-400 font-medium px-2">
              v1.0.0 &bull; Operational
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE NATIVE BOTTOM SHEET MENU (Mobile Screens Only) */}
      {/* ======================================================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Bottom Sheet Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300 overflow-hidden max-h-[85vh]">
            {/* Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Mobile Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-horizontal.svg"
                  alt="Dastak Logo"
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/logo-horizontal.png'
                  }}
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2845D6]/10 text-[#2845D6] dark:bg-blue-900/40 dark:text-blue-300">
                  {ROLE_LABELS[role] || 'Admin'}
                </span>
              </div>

              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Column Native App Navigation Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2.5">
                {allowedNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 border ${
                        isActive
                          ? 'bg-[#2845D6] text-white border-[#2845D6] shadow-md shadow-[#2845D6]/25 ring-2 ring-[#2845D6]/30'
                          : 'bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.color
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.label}
                      </span>
                    </NavLink>
                  )
                })}
              </div>
            </div>

            {/* Bottom Controls: Theme Switcher & Sign Out */}
            <div className="p-4 pt-2 pb-10 border-t border-slate-100 dark:border-slate-700/80 space-y-2 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-600" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCloseMobile()
                    logout()
                  }}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-600 dark:text-rose-400 active:scale-95 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
