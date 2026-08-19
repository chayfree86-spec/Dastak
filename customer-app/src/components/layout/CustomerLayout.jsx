import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Store,
  Clock,
  ShoppingBag,
  Menu,
  Search,
  MapPin,
  ChevronDown,
  Moon,
  Sun,
  Globe,
  Bike,
  UtensilsCrossed,
  Receipt,
  FileText,
  Settings,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useLocationContext } from '../../context/LocationContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import LocationPickerModal from '../common/LocationPickerModal'
import GpsEnableModal from '../common/GpsEnableModal'
import ActiveOrderBanner from '../common/ActiveOrderBanner'
import customerApi from '../../api/customer.api'

export const CustomerLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, toggleLanguage, t } = useLanguage()
  const { activeAddress, isGpsModalOpen, closeGpsModal } = useLocationContext()
  const { itemCount } = useCart()
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()

  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)

  // Poll for active order if user is logged in
  useEffect(() => {
    if (!isAuthenticated) return

    const checkActiveOrder = async () => {
      try {
        const res = await customerApi.getOrders({ status: 'active' })
        const orders = res.data?.data || res.data || []
        const active = orders.find(
          (o) =>
            o.status !== 'DELIVERED' &&
            o.status !== 'CANCELLED' &&
            o.status !== 'REJECTED'
        )
        setActiveOrder(active || null)
      } catch (e) {}
    }

    checkActiveOrder()
    const interval = setInterval(checkActiveOrder, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated, location.pathname])

  // 5 Footer Navigation Tabs:
  // 1. Restaurants | 2. Cart | 3. HOME (Center) | 4. Report | 5. Setting
  const navItems = [
    { to: '/restaurants', label: t.navRestaurants || 'Restaurants', icon: Store },
    {
      to: '/cart',
      label: t.navCart || 'Cart',
      icon: ShoppingBag,
      badge: itemCount,
      hasActiveBadge: Boolean(activeOrder),
    },
    {
      to: '/',
      label: t.navHome || 'Home',
      icon: Home,
      isCenter: true,
    },
    { to: '/reports', label: t.navReports || 'Report', icon: Receipt },
    { to: '/settings', label: t.navSettings || 'Setting', icon: Settings },
  ]

  const isAuthPage = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-[#2845D6] selection:text-white">
      {/* 1. Header (Full Width Web Header - Hidden on Auth / Login pages) */}
      {!isAuthPage && (
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs h-14 sm:h-16 flex items-center">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Logo & Delivery Location */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 cursor-pointer select-none shrink-0 bg-transparent border-0 p-0"
                aria-label="Dastak Food and Grocery Home"
              >
                <img
                  src="/logo-horizontal.svg"
                  alt="Dastak Logo"
                  width="140"
                  height="36"
                  className="h-8 sm:h-9 max-h-9 w-auto max-w-[130px] sm:max-w-[170px] object-contain shrink-0"
                  style={{ height: '32px', maxHeight: '36px', width: 'auto' }}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/logo-horizontal.png'
                  }}
                />
              </button>

              {/* Location Selector Pill */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left min-w-0 max-w-[130px] xs:max-w-[165px] sm:max-w-xs cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shrink"
                aria-label={`Delivering to: ${activeAddress?.address || 'Civil Lines, Kanpur'}. Click to change address.`}
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F97316] shrink-0" />
                <div className="min-w-0 truncate flex-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider leading-none">
                    {t.deliveringTo}
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-slate-100 truncate block leading-tight">
                    {activeAddress?.address || 'Civil Lines, Kanpur'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>

            {/* Right Header Utilities: Language Switcher, Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Language Switcher Button [English / हिंदी] */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer"
                title="Toggle English / हिंदी"
                aria-label="Toggle language between English and Hindi"
              >
                <Globe className="w-3.5 h-3.5 text-[#2845D6]" />
                <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
              </button>

              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Toggle Theme"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Page Content (Full Width Max-W-7xl Web Container) */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 py-4 sm:p-6 ${isAuthPage ? 'pb-8 flex flex-col justify-center' : 'pb-28 sm:pb-32'}`}>
        <Outlet />
      </main>

      {/* 3. Universal Bottom Footer Navigation Bar */}
      {!isAuthPage && (
        <nav
          className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-2xl px-2 sm:px-6 overflow-visible"
          style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0px))' }}
          aria-label="Main Mobile Navigation"
        >
          <div className="max-w-md sm:max-w-2xl mx-auto grid grid-cols-5 items-end justify-items-center relative">
            {navItems.map((item) => {
              const Icon = item.icon

              // Center Elevated Home Button
              if (item.isCenter) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className="group relative flex flex-col items-center select-none cursor-pointer -mt-6 mb-1 focus:outline-none z-10"
                    aria-label="Go to Home"
                  >
                    {({ isActive }) => (
                      <>
                        {/* Elevated Circular Disc */}
                        <div
                          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-active:scale-95 ring-4 ring-white dark:ring-slate-900 shadow-lg ${
                            isActive
                              ? 'bg-gradient-to-tr from-[#FF5200] via-[#F97316] to-amber-500 text-white shadow-orange-500/40'
                              : 'bg-gradient-to-tr from-[#FF5200] to-[#EA580C] text-white shadow-orange-500/30'
                          }`}
                        >
                          <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white stroke-[2.2] drop-shadow-xs" />
                        </div>

                        {/* Center Home Label */}
                        <span
                          className={`text-[11px] font-bold mt-1.5 transition-colors leading-tight text-center ${
                            isActive
                              ? 'text-[#FF5200] dark:text-orange-400 font-extrabold'
                              : 'text-slate-700 dark:text-slate-300 group-hover:text-[#FF5200]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              }

              // Standard Navigation Tabs
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center pt-2 pb-1 px-1 rounded-xl transition-colors duration-150 select-none w-full gap-1 ${
                      isActive
                        ? 'text-[#FF5200] dark:text-orange-400 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                  aria-label={`Navigate to ${item.label}`}
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative flex items-center justify-center">
                        <Icon
                          className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${
                            isActive ? 'stroke-[2.4] scale-105' : 'stroke-[1.8]'
                          }`}
                        />
                        {item.badge > 0 && (
                          <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[17px] h-[17px] rounded-full bg-[#FF5200] text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 leading-none">
                            {item.badge}
                          </span>
                        )}
                        {item.hasActiveBadge && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] text-center truncate max-w-full leading-tight ${
                          isActive
                            ? 'font-bold text-[#FF5200] dark:text-orange-400'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />

      {/* GPS Enable Custom Popup Modal */}
      <GpsEnableModal
        isOpen={isGpsModalOpen}
        onClose={closeGpsModal}
        onOpenPicker={() => setLocationModalOpen(true)}
      />
    </div>
  )
}

export default CustomerLayout
