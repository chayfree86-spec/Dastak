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
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useLocationContext } from '../../context/LocationContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import LocationPickerModal from '../common/LocationPickerModal'
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

  // Center Home icon layout:
  // 1. Restaurants | 2. Orders | 3. HOME (Center Animated) | 4. Cart | 5. More
  const navItems = [
    { to: '/restaurants', label: t.navRestaurants || 'Restaurants', icon: Store },
    {
      to: '/orders',
      label: t.navOrders || 'Orders',
      icon: Clock,
      hasActiveBadge: Boolean(activeOrder),
    },
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
    },
    { to: '/more', label: t.navMore || 'More', icon: Menu },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Delivery Location */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer select-none shrink-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-600/20">
                D
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-tight text-[#2845D6] dark:text-blue-400 block leading-tight">
                  DASTAK
                </span>
                <span className="text-[10px] font-black uppercase text-[#F97316] tracking-wider block">
                  Food Delivery
                </span>
              </div>
            </div>

            {/* Location Selector Pill */}
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors text-left min-w-0 max-w-[180px] sm:max-w-xs cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#F97316] shrink-0" />
              <div className="min-w-0 truncate">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider leading-none">
                  {t.deliveringTo}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate block">
                  {activeAddress?.address || 'Civil Lines, Kanpur'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            </button>
          </div>

          {/* Desktop Search Bar Shortcut */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div
              onClick={() => navigate('/search')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center gap-2.5 cursor-pointer hover:border-[#2845D6] transition-colors"
            >
              <Search className="w-4 h-4 text-[#2845D6]" />
              <span className="truncate">{t.searchPlaceholder}</span>
            </div>
          </div>

          {/* Right Header Utilities: Language Switcher, Theme Toggle, Cart */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher Button [English / हिंदी] */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              title="Toggle English / हिंदी"
            >
              <Globe className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#2845D6] hover:bg-[#1E3A8A] text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all cursor-pointer relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t.navCart}</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-32 sm:pb-36">
        <Outlet />
      </main>

      {/* 3. Floating Bottom Active Order Alert Bar (if active order in progress) */}
      {activeOrder && location.pathname !== `/orders/${activeOrder.order_number}` && (
        <div className="fixed bottom-24 inset-x-4 max-w-lg mx-auto z-40">
          <div
            onClick={() => navigate(`/orders/${activeOrder.order_number}`)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2845D6] to-[#F97316] text-white shadow-2xl shadow-blue-600/40 flex items-center justify-between gap-3 animate-bounce duration-1000 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider block">
                  ORDER ON THE WAY
                </span>
                <span className="text-xs font-black truncate block">
                  #{activeOrder.order_number} • {activeOrder.restaurant?.name || 'Kitchen'}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-black bg-white/20 px-3 py-1 rounded-xl shrink-0">
              {t.trackOrder} →
            </span>
          </div>
        </div>
      )}

      {/* 4. Universal Bottom Footer Navigation Bar with Elevated Animated Center Home Icon */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-2xl py-1 px-2 sm:px-6">
        <div className="max-w-md sm:max-w-2xl mx-auto grid grid-cols-5 items-end justify-items-center">
          {navItems.map((item) => {
            const Icon = item.icon

            // Center Elevated Animated Home Button
            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className="group relative flex flex-col items-center select-none cursor-pointer -mt-6 sm:-mt-7 mb-1 focus:outline-none"
                >
                  {({ isActive }) => (
                    <>
                      {/* Floating Elevated Disc */}
                      <div className="relative">
                        {/* Pulsing Aura Glow Behind Home Icon */}
                        <span className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#2845D6] via-indigo-500 to-[#F97316] opacity-60 blur-xs animate-pulse-ring pointer-events-none" />

                        <div
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#2845D6] via-blue-600 to-[#F97316] text-white flex items-center justify-center shadow-2xl border-4 border-slate-50 dark:border-slate-950 transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${
                            isActive
                              ? 'shadow-blue-600/60 ring-2 ring-[#F97316]'
                              : 'shadow-blue-600/35 hover:shadow-orange-500/40'
                          }`}
                        >
                          <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] group-hover:rotate-6 transition-transform duration-300 drop-shadow-md" />
                          <Sparkles className="w-3.5 h-3.5 absolute top-1.5 right-1.5 text-amber-300 animate-spin duration-3000 opacity-90 pointer-events-none" />
                        </div>
                      </div>

                      {/* Center Home Label */}
                      <span
                        className={`text-[10px] sm:text-[11px] font-black mt-1 tracking-tight transition-colors ${
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
                  `flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all duration-200 relative select-none w-full ${
                    isActive
                      ? 'text-[#2845D6] dark:text-blue-400 font-black bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#F97316] text-white text-[9px] font-black shadow-xs ring-2 ring-white dark:ring-slate-900">
                      {item.badge}
                    </span>
                  )}
                  {item.hasActiveBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs mt-1 tracking-tight truncate max-w-full font-bold">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  )
}

export default CustomerLayout
