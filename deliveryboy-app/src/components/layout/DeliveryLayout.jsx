import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Package,
  DollarSign,
  Banknote,
  User,
  Settings,
  LogOut,
  Bike,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  MapPin,
  Star,
  Power,
  ShieldCheck,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import { BottomNav } from './BottomNav'
import NewAssignmentSheet from '../delivery/NewAssignmentSheet'
import DutyToggleModal from '../delivery/DutyToggleModal'
import ConfirmDialog from '../common/ConfirmDialog'
import { formatCurrency } from '../../utils/formatters'

export const DeliveryLayout = () => {
  const {
    user,
    riderProfile,
    toggleDutyStatus,
    activeOrder,
    newAssignmentModal,
    setNewAssignmentModal,
    logout,
  } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { soundEnabled, toggleSound } = useSound()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [dutyModalOpen, setDutyModalOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [dutyLoading, setDutyLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const isOnline = !!riderProfile?.is_online
  const pendingCod = riderProfile?.pending_cod_amount || 0
  const rating = Number(riderProfile?.rating || 4.9).toFixed(1)

  const navItems = [
    { to: '/', label: 'Home Dashboard', icon: Home, exact: true },
    {
      to: '/deliveries',
      label: 'Delivery Trips',
      icon: Package,
      badge: activeOrder ? 'Active Trip' : null,
      badgeColor: 'bg-[#F97316] text-white',
    },
    { to: '/earnings', label: 'Earnings & Payouts', icon: DollarSign },
    {
      to: '/cod',
      label: 'COD Cash Ledger',
      icon: Banknote,
      badge: pendingCod > 0 ? formatCurrency(pendingCod) : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { to: '/profile', label: 'Rider Profile & Vehicle', icon: User },
    { to: '/settings', label: 'App Settings', icon: Settings },
  ]

  const handleDutyToggleClick = () => {
    if (isOnline) {
      setDutyModalOpen(true)
    } else {
      executeDutyChange(true)
    }
  }

  const executeDutyChange = async (targetState) => {
    setDutyLoading(true)
    try {
      await toggleDutyStatus(targetState)
      toast.success(
        targetState ? 'You are Now Online!' : 'You are Now Offline',
        targetState
          ? 'Available to receive incoming delivery assignments.'
          : 'Trip assignments paused.'
      )
      setDutyModalOpen(false)
    } catch (err) {
      toast.error('Duty Update Failed', err.message || 'Could not change duty status.')
    } finally {
      setDutyLoading(false)
    }
  }

  const handleConfirmLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setLogoutLoading(false)
      setLogoutModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-slate-900 text-[#102A43] dark:text-slate-100 transition-colors duration-200 font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. Desktop Left Sidebar (Full height sticky sidebar)                       */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200/80 dark:border-slate-700/80 shrink-0 h-screen sticky top-0 transition-colors duration-200 select-none z-30">
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                DASTAK <span className="text-[#2845D6] dark:text-blue-400">RIDER</span>
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 truncate">
                Delivery Fleet Portal
              </p>
            </div>
          </div>
        </div>

        {/* Rider Profile Card & Online/Offline Switch in Sidebar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#2845D6] text-white flex items-center justify-center font-black text-sm shrink-0">
                {user?.name?.charAt(0) || 'R'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                  {user?.name || 'Rider'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 block truncate">
                  {riderProfile?.vehicle_number || 'UP78-FLEET'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-black text-amber-500 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          {/* Prominent Sidebar Duty Toggle Button */}
          <button
            type="button"
            onClick={handleDutyToggleClick}
            disabled={dutyLoading}
            className={`w-full py-2.5 px-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-white animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="uppercase tracking-wider">
              {isOnline ? 'DUTY: ONLINE' : 'DUTY: OFFLINE'}
            </span>
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/20 font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-blue-100 dark:bg-blue-950 text-[#2845D6]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer Controls: Theme, Sound & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#2845D6] dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title="Toggle Audio Tone"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="w-full p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. Main Fullwidth Content Area                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/20 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                {user?.name || 'Rahul Verma'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block truncate">
                Kanpur Central Zone
              </span>
            </div>
          </div>

          {/* Right Mobile Status Button */}
          <button
            type="button"
            onClick={handleDutyToggleClick}
            disabled={dutyLoading}
            className={`px-3 py-1 rounded-2xl border font-black text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-white animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </header>

        {/* Fullwidth Page Body */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-full pb-24 md:pb-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global New Assignment Modal */}
      {newAssignmentModal && (
        <NewAssignmentSheet
          order={newAssignmentModal}
          onClose={() => setNewAssignmentModal(null)}
          onAcknowledge={(order) => {
            setNewAssignmentModal(null)
            navigate('/')
          }}
        />
      )}

      {/* Offline Duty Safety Confirmation Modal */}
      <DutyToggleModal
        isOpen={dutyModalOpen}
        onClose={() => setDutyModalOpen(false)}
        onConfirm={() => executeDutyChange(false)}
        loading={dutyLoading}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out from Fleet?"
        message="You will stop receiving delivery assignments until you sign back in."
        confirmText="Yes, Sign Out"
        cancelText="Stay Active"
        type="danger"
        loading={logoutLoading}
      />
    </div>
  )
}

export default DeliveryLayout
