import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  UtensilsCrossed,
  Clock,
  Settings,
  Store,
  BarChart3,
  Wallet,
  Volume2,
  VolumeX,
  LogOut,
  Power,
  RefreshCw,
  Sun,
  Moon,
  Menu as MenuIcon,
  X as CloseIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSound } from '../../context/SoundContext'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { useOrderPolling } from '../../hooks/useOrderPolling'
import restaurantApi from '../../api/restaurant.api'
import Modal from '../common/Modal'
import Button from '../common/Button'
import CustomSelect from '../common/CustomSelect'

export const PartnerLayout = () => {
  const { user, restaurant, logout, updateRestaurant } = useAuth()
  const { soundEnabled, toggleSound } = useSound()
  const { theme, toggleTheme, isDark } = useTheme()
  const toast = useToast()
  const location = useLocation()

  // Real-time polling for new orders every 10 seconds with audio chime
  const { newOrdersCount, refreshOrders } = useOrderPolling(10000)

  const [offlineModalOpen, setOfflineModalOpen] = useState(false)
  const [offlineReason, setOfflineReason] = useState('Kitchen Peak Hours / Prep Delay')
  const [toggleLoading, setToggleLoading] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isStoreOpen = restaurant?.is_open ?? true

  // Fast Store Online/Offline Toggle
  const handleToggleStoreStatus = async (reason = null) => {
    setToggleLoading(true)
    const nextStatus = !isStoreOpen
    try {
      await restaurantApi.toggleOpenStatus(nextStatus, reason)
      updateRestaurant({ is_open: nextStatus })
      toast.success(
        nextStatus ? 'Store is Now ONLINE' : 'Store is Now OFFLINE',
        nextStatus
          ? 'You will now receive incoming customer orders.'
          : 'Store paused. New incoming orders are halted.'
      )
      setOfflineModalOpen(false)
    } catch (err) {
      toast.error('Failed to change status', err.message || 'Please check your connection.')
    } finally {
      setToggleLoading(false)
    }
  }

  const navItems = [
    {
      label: 'New Orders',
      path: '/new-orders',
      icon: Bell,
      badge: newOrdersCount,
    },
    { label: 'All Orders', path: '/orders', icon: Clock },
    { label: 'Menu', path: '/menu', icon: UtensilsCrossed },
    { label: 'Dashboard', path: '/dashboard', icon: Store },
    { label: 'Reports', path: '/reports', icon: BarChart3, desktopOnly: true },
    { label: 'Settlements', path: '/settlements', icon: Wallet, desktopOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-slate-900 text-[#102A43] dark:text-slate-100 transition-colors duration-200">
      {/* 1. Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200/80 dark:border-slate-700 shrink-0 h-screen sticky top-0 transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak Partner"
              className="h-8 max-h-8 w-auto object-contain shrink-0"
              style={{ height: '32px', maxHeight: '32px', width: 'auto' }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
          </div>
        </div>

        {/* Online / Offline Banner on Desktop Sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div
            onClick={() => {
              if (isStoreOpen) setOfflineModalOpen(true)
              else handleToggleStoreStatus()
            }}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              isStoreOpen
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-300 hover:bg-rose-100/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStoreOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider">
                {isStoreOpen ? 'Online (Taking Orders)' : 'Offline (Paused)'}
              </span>
            </div>
            <Power className="w-4 h-4" />
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#2845D6] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm shadow-rose-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile, Theme & Sound Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="text-[11px]">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Sound Alert Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-700/60 text-slate-400 border-slate-200/80 dark:border-slate-600'
              }`}
            >
              <span className="text-[11px]">Sound</span>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 font-bold text-xs transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Top Header (Mobile & Desktop) */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 transition-colors duration-200">
          {/* Mobile Brand Indicator (Single clean restaurant name and avatar) */}
          <div className="flex items-center gap-2.5 md:hidden min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#2845D6] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              D
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[150px] xs:max-w-[180px]">
                {restaurant?.name || 'Dastak Partner'}
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                Kitchen Operations
              </p>
            </div>
          </div>

          {/* Desktop Breadcrumbs / Screen Title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Kitchen Portal'}
            </h1>
          </div>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Online/Offline Toggle Button for Mobile Header */}
            <button
              type="button"
              onClick={() => {
                if (isStoreOpen) setOfflineModalOpen(true)
                else handleToggleStoreStatus()
              }}
              disabled={toggleLoading}
              className={`md:hidden px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                isStoreOpen
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {isStoreOpen ? '🟢 Online' : '🔴 Offline'}
            </button>

            {/* Dark / Light Theme Toggle in Top Header */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Order Audio Chime: ON' : 'Order Audio Chime: OFF'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content Container (Full Width Responsive) */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 w-full max-w-none pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 3. Reference-Matched Modern Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] h-[68px] pb-safe select-none">
        <div className="grid grid-cols-5 h-full items-end pb-2 px-1">
          {/* 1. Dashboard (Restaurants) */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-end h-full px-0.5 transition-colors ${
                isActive
                  ? 'text-[#EA580C] dark:text-orange-400 font-bold'
                  : 'text-slate-400 dark:text-slate-400 font-medium hover:text-slate-600'
              }`
            }
          >
            <Store className="w-5 h-5 mb-1 stroke-[1.8]" />
            <span className="text-[10px] leading-none truncate max-w-full">Dashboard</span>
          </NavLink>

          {/* 2. Menu */}
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `flex flex-col items-center justify-end h-full px-0.5 transition-colors ${
                isActive
                  ? 'text-[#EA580C] dark:text-orange-400 font-bold'
                  : 'text-slate-400 dark:text-slate-400 font-medium hover:text-slate-600'
              }`
            }
          >
            <UtensilsCrossed className="w-5 h-5 mb-1 stroke-[1.8]" />
            <span className="text-[10px] leading-none truncate max-w-full">Menu</span>
          </NavLink>

          {/* 3. CENTER HERO: Dynamic Elevated Action Button (Orange when active or has pending orders, sleek Gray when idle) */}
          {(() => {
            const isNewOrdersActive = location.pathname === '/new-orders' || (newOrdersCount && newOrdersCount > 0)
            return (
              <NavLink
                to="/new-orders"
                className="flex flex-col items-center justify-end h-full relative group px-0.5"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 border-[2.5px] border-white dark:border-slate-800 -mt-10 mb-2 active:scale-95 ${
                    isNewOrdersActive
                      ? 'bg-gradient-to-b from-[#FB923C] to-[#EA580C] text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/30 scale-105'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 shadow-sm hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Bell
                    className={`w-6 h-6 stroke-[2.3] ${
                      isNewOrdersActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  />

                  {/* Real-Time Live Orders Notification Badge */}
                  {newOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse shadow-md border-2 border-white dark:border-slate-800">
                      {newOrdersCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-none tracking-tight truncate max-w-full ${
                    isNewOrdersActive
                      ? 'font-bold text-[#EA580C] dark:text-orange-400'
                      : 'font-medium text-slate-400 dark:text-slate-400'
                  }`}
                >
                  New Orders
                </span>
              </NavLink>
            )
          })()}

          {/* 4. All Orders (Report) */}
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-end h-full px-0.5 transition-colors ${
                isActive
                  ? 'text-[#EA580C] dark:text-orange-400 font-bold'
                  : 'text-slate-400 dark:text-slate-400 font-medium hover:text-slate-600'
              }`
            }
          >
            <Clock className="w-5 h-5 mb-1 stroke-[1.8]" />
            <span className="text-[10px] leading-none truncate max-w-full">All Orders</span>
          </NavLink>

          {/* 5. More (Settings & Drawer) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className={`flex flex-col items-center justify-end h-full px-0.5 transition-colors cursor-pointer ${
              ['/settings', '/reports', '/settlements'].includes(location.pathname) || mobileDrawerOpen
                ? 'text-[#EA580C] dark:text-orange-400 font-bold'
                : 'text-slate-400 dark:text-slate-400 font-medium hover:text-slate-600'
            }`}
          >
            <MenuIcon className="w-5 h-5 mb-1 stroke-[1.8]" />
            <span className="text-[10px] leading-none truncate max-w-full">More</span>
          </button>
        </div>
      </nav>

      {/* 4. Mobile Slide-Over Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Slide Drawer Content */}
          <div className="fixed inset-y-0 right-0 max-w-[290px] w-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2845D6] text-white flex items-center justify-center font-black text-sm">
                  D
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                    {restaurant?.name || 'Dastak Partner'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">Kitchen Operations</span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Online / Offline Quick Switch in Drawer */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
              <div
                onClick={() => {
                  setMobileDrawerOpen(false)
                  if (isStoreOpen) setOfflineModalOpen(true)
                  else handleToggleStoreStatus()
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                  isStoreOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isStoreOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-xs font-black uppercase">
                    {isStoreOpen ? 'Store is Online' : 'Store is Offline'}
                  </span>
                </div>
                <Power className="w-4 h-4" />
              </div>
            </div>

            {/* Nav Items in Drawer (Includes Settings, Reports, Settlements, Menu, etc.) */}
            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu & Management
              </div>

              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-[#2845D6] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer in Drawer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false)
                  logout()
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Pause / Offline Confirmation Modal */}
      <Modal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
        title="Pause Store (Go Offline)?"
        subtitle="While offline, your restaurant will appear closed to customers and you will not receive new orders."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <CustomSelect
            label="Reason for Pausing"
            value={offlineReason}
            onChange={setOfflineReason}
            options={[
              { value: 'Kitchen Peak Hours / Prep Delay', label: 'Kitchen Peak Hours / Prep Delay' },
              { value: 'Ingredients / Stock Shortage', label: 'Ingredients / Stock Shortage' },
              { value: 'Staff Shortage', label: 'Staff Shortage' },
              { value: 'Power / Equipment Issue', label: 'Power / Equipment Issue' },
              { value: 'Store Closed for Today', label: 'Store Closed for Today' },
            ]}
          />

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
            <strong>Note:</strong> Ongoing orders that you have already accepted will still need to
            be prepared and handed over to riders.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setOfflineModalOpen(false)}
              disabled={toggleLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={toggleLoading}
              onClick={() => handleToggleStoreStatus(offlineReason)}
              className="flex-1"
            >
              Confirm & Go Offline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PartnerLayout
