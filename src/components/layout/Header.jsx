import React, { useState, useRef, useEffect } from 'react'
import { Menu, Search, Sun, Moon, LogOut, User, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ROLE_LABELS } from '../../utils/permissions'
import NotificationsPopover from './NotificationsPopover'
import GlobalSearchModal from './GlobalSearchModal'

export const Header = ({ onOpenMobileSidebar, title, breadcrumbs = [] }) => {
  const { user, logout, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Breadcrumb / Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {title || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Right Side: Global Search + Theme Toggle + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 transition-colors text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <NotificationsPopover />

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2845D6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {ROLE_LABELS[role] || 'Admin'}
                </span>
              </div>
              <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name || 'Admin'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@dastak.in'}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2845D6]/10 text-[#2845D6] dark:text-blue-400">
                    <Shield className="w-3 h-3" />
                    {ROLE_LABELS[role] || 'Admin'}
                  </span>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default Header
