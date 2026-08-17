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
            <div className="w-10 h-10 rounded-2xl bg-[#2845D6] text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
              D
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                Dastak Partner
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 truncate max-w-[140px]">
                {restaurant?.name || 'Kitchen POS'}
              </p>
            </div>
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
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 transition-colors duration-200">
          {/* Mobile Brand / Screen Indicator */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-9 h-9 rounded-2xl bg-[#2845D6] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              D
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[160px]">
                {restaurant?.name || 'Dastak Partner'}
              </h1>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStoreOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  {isStoreOpen ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Breadcrumbs / Screen Title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Kitchen Portal'}
            </h1>
          </div>

          {/* Right Quick Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Online/Offline Toggle Button for Mobile Header */}
            <button
              type="button"
              onClick={() => {
                if (isStoreOpen) setOfflineModalOpen(true)
                else handleToggleStoreStatus()
              }}
              disabled={toggleLoading}
              className={`md:hidden px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
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
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
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
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Live Refresh Button */}
            <button
              type="button"
              onClick={() => refreshOrders()}
              title="Refresh Orders"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Container (Full Width) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-none">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Sticky Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 px-2 py-1.5 flex items-center justify-around pb-safe">
        {navItems
          .filter((item) => !item.desktopOnly)
          .map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl relative transition-all min-w-[56px]"
              >
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? 'text-[#2845D6] dark:text-blue-400 scale-110'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-bold ${
                    isActive
                      ? 'text-[#2845D6] dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            )
          })}
      </nav>

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
