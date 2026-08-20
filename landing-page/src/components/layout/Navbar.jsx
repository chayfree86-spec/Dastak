import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Store,
  Bike,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { APP_URLS } from '../../config/appUrls'

export const Navbar = ({ onOpenPartnerModal, onOpenRiderModal }) => {
  const { isDark, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [portalsOpen, setPortalsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-slate-200/80 dark:border-slate-800/80 py-3'
          : 'bg-slate-950/60 backdrop-blur-md border-b border-white/10 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img
              src="/logo-horizontal.svg"
              alt="Dastak Logo"
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/logo-horizontal.png'
              }}
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className={`hidden md:flex items-center gap-7 lg:gap-8 text-sm font-bold transition-colors ${
              scrolled
                ? 'text-slate-700 dark:text-slate-200'
                : 'text-white drop-shadow-md'
            }`}
          >
            <a href="#categories" className="hover:text-[#FF5200] transition-colors">
              Categories
            </a>
            <a href="#restaurants" className="hover:text-[#FF5200] transition-colors">
              Restaurants
            </a>
            <a href="#ecosystem" className="hover:text-[#FF5200] transition-colors">
              Ecosystem
            </a>
            <a href="#how-it-works" className="hover:text-[#FF5200] transition-colors">
              How It Works
            </a>
            <a href="#coverage" className="hover:text-[#FF5200] transition-colors">
              Cities
            </a>

            {/* Portals Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setPortalsOpen(!portalsOpen)}
                className="flex items-center gap-1 hover:text-[#FF5200] transition-colors cursor-pointer"
              >
                <span>Login Portals</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80 group-hover:rotate-180 transition-transform" />
              </button>

              <div className="absolute top-full right-0 mt-3 w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a
                  href={APP_URLS.partnerLogin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#FF5200]" />
                    <span>Restaurant Partner</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href={APP_URLS.riderLogin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Bike className="w-4 h-4 text-emerald-500" />
                    <span>Delivery Rider</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                scrolled
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-white hover:bg-white/15 backdrop-blur-xs'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href={APP_URLS.customerLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5200] to-[#FF7A00] hover:from-[#E04800] hover:to-[#FF6B00] text-white font-black text-sm shadow-md shadow-[#FF5200]/30 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Food</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors ${
                scrolled
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-white hover:bg-white/15'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors ${
                scrolled
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'text-white hover:bg-white/15'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-4 pb-6 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            <a
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Categories
            </a>
            <a
              href="#restaurants"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Restaurants
            </a>
            <a
              href="#ecosystem"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Partner & Rider Ecosystem
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              How It Works
            </a>
            <a
              href="#coverage"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Coverage Cities
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <a
              href={APP_URLS.customerLogin}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF5200] text-white font-bold text-sm shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order on Dastak App</span>
            </a>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={APP_URLS.partnerLogin}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-xs font-bold text-[#FF5200]"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Partner Login</span>
              </a>
              <a
                href={APP_URLS.riderLogin}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Rider Login</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
