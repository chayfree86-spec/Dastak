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
  Sparkles,
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
import ActiveOrderBanner from '../common/ActiveOrderBanner'
import customerApi from '../../api/customer.api'

export const CustomerLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, toggleLanguage, t } = useLanguage()
  const { activeAddress } = useLocationContext()
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
  // 1. Restaurants | 2. Report | 3. HOME (Center) | 4. Cart | 5. Setting
  const navItems = [
    { to: '/restaurants', label: t.navRestaurants || 'Restaurants', icon: Store },
    { to: '/reports', label: t.navReports || 'Report', icon: Receipt },
    {
      to: '/',
      label: t.navHome || 'Home',
      icon: Home,
      isCenter: true,
    },
    {
      to: '/cart',
      label: t.navCart || 'Cart',
      icon: ShoppingBag,
      badge: itemCount,
      hasActiveBadge: Boolean(activeOrder),
    },
    { to: '/settings', label: t.navSettings || 'Setting', icon: Settings },
  ]

  const isAuthPage = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center font-sans transition-colors duration-200 antialiased selection:bg-[#2845D6] selection:text-white">
      {/* Mobile Screen Shell Frame */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen shadow-2xl relative border-x border-slate-200/60 dark:border-slate-800/60 flex flex-col">
        {/* 1. Header (Regular vs Auth) */}
        {isAuthPage ? (
          <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs px-4 py-2.5 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
              >
                <Globe className="w-3 h-3 text-[#2845D6]" />
                <span>{lang === 'en' ? 'हिं' : 'EN'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </header>
        ) : (
          <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              {/* Logo & Delivery Location */}
              <div className="flex items-center gap-1.5 xs:gap-2 min-w-0 flex-1">
                <div
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1 cursor-pointer select-none shrink-0"
                >
                  <img
                    src="/logo-horizontal.svg"
                    alt="Dastak Logo"
                    className="h-6 sm:h-7.5 w-auto object-contain shrink-0"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/logo-light.png'
                    }}
                  />
                </div>

                {/* Location Selector Pill */}
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-1 xs:gap-1.5 px-2 py-1 xs:px-2.5 xs:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors text-left min-w-0 flex-1 max-w-[130px] xs:max-w-[160px] cursor-pointer"
                >
                  <MapPin className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#F97316] shrink-0" />
                  <div className="min-w-0 truncate flex-1">
                    <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider leading-none">
                      {t.deliveringTo}
                    </span>
                    <span className="text-[10px] xs:text-[11px] font-black text-slate-900 dark:text-slate-100 truncate block leading-tight">
                      {activeAddress?.address || 'Civil Lines, Kanpur'}
                    </span>
                  </div>
                  <ChevronDown className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-slate-400 shrink-0" />
                </button>
              </div>

              {/* Right Header Utilities: Language Switcher, Theme Toggle, Cart */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Language Switcher Button [English / हिंदी] */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
                  title="Toggle English / हिंदी"
                >
                  <Globe className="w-3 h-3 text-[#2845D6]" />
                  <span>{lang === 'en' ? 'हिं' : 'EN'}</span>
                </button>

                {/* Dark / Light Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {/* Cart Button */}
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white text-[11px] font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer relative"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {itemCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#F97316] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* 2. Main Page Content */}
        <main className={`flex-1 w-full px-3.5 py-3 ${isAuthPage ? 'pb-8 flex flex-col justify-center' : 'pb-24'}`}>
          <Outlet />
        </main>

        {/* 4. Universal Bottom Footer Navigation Bar (Only for non-auth pages) */}
        {!isAuthPage && (
          <nav
            className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-50 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shadow-2xl pt-1.5 px-2.5 xs:px-3"
            style={{ paddingBottom: 'max(0.45rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="grid grid-cols-5 items-end justify-items-center">
              {navItems.map((item) => {
                const Icon = item.icon

                // Center Elevated Home Button
                if (item.isCenter) {
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      className="group relative flex flex-col items-center select-none cursor-pointer -mt-5 mb-0.5 focus:outline-none"
                    >
                      {({ isActive }) => (
                        <>
                          {/* Solid Elevated Circular Disc */}
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg transition-all duration-200 group-hover:scale-105 group-active:scale-95 ${
                              isActive
                                ? 'bg-gradient-to-tr from-[#2845D6] via-blue-600 to-[#F97316] text-white shadow-blue-600/40 ring-2 ring-[#2845D6]/30'
                              : 'bg-gradient-to-tr from-[#2845D6] to-[#1E3A8A] text-white shadow-blue-600/30'
                            }`}
                          >
                            <Icon className="w-6 h-6 text-white stroke-[2.2] drop-shadow-xs" />
                          </div>

                          {/* Center Home Label */}
                          <span
                            className={`text-[11px] font-extrabold mt-1 tracking-tight transition-colors leading-none ${
                              isActive
                                ? 'text-[#2845D6] dark:text-blue-400'
                                : 'text-slate-700 dark:text-slate-300 group-hover:text-[#2845D6]'
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
                      `flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-150 select-none w-full ${
                        isActive
                          ? 'text-[#2845D6] dark:text-blue-400 font-extrabold'
                          : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="relative">
                          <Icon
                            className={`w-5 h-5 transition-transform ${
                              isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'
                            }`}
                          />
                          {item.badge > 0 && (
                            <span className="absolute -top-1 -right-2.5 px-1.5 py-0.5 min-w-[17px] h-[17px] rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 leading-none">
                              {item.badge}
                            </span>
                          )}
                          {item.hasActiveBadge && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] mt-1 tracking-tight text-center truncate max-w-full leading-none ${
                            isActive
                              ? 'font-extrabold text-[#2845D6] dark:text-blue-400'
                              : 'font-semibold text-slate-600 dark:text-slate-400'
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
      </div>
    </div>
  )
}

export default CustomerLayout
