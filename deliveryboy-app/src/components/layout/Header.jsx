import React, { useState } from 'react'
import {
  Power,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  MapPin,
  Bike,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import DutyToggleModal from '../delivery/DutyToggleModal'

export const Header = () => {
  const { riderProfile, toggleDutyStatus, user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { soundEnabled, toggleSound } = useSound()
  const toast = useToast()

  const [dutyModalOpen, setDutyModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isOnline = !!riderProfile?.is_online

  const handleDutyToggleClick = () => {
    if (isOnline) {
      // Prompt modal before going offline
      setDutyModalOpen(true)
    } else {
      // Go online directly
      executeDutyChange(true)
    }
  }

  const executeDutyChange = async (targetState) => {
    setLoading(true)
    try {
      await toggleDutyStatus(targetState)
      toast.success(
        targetState ? 'You are Now Online!' : 'You are Now Offline',
        targetState
          ? 'Available to receive new delivery assignments.'
          : 'Trip assignments paused.'
      )
      setDutyModalOpen(false)
    } catch (err) {
      toast.error('Duty Update Failed', err.message || 'Could not change duty status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand Logo & Rider Greeting */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {riderProfile?.user?.name || user?.name || 'Dastak Rider'}
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-[#2845D6] dark:text-blue-400">
                  {riderProfile?.vehicle_number || 'FLEET'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3 text-[#F97316]" />
                <span className="truncate">Kanpur Central Zone</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Online / Offline Duty Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#2845D6] dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Order Audio Sound On' : 'Order Audio Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Prominent Duty Pill Button */}
            <button
              type="button"
              onClick={handleDutyToggleClick}
              disabled={loading}
              className={`relative px-3.5 py-1.5 rounded-2xl border font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-white animate-ping' : 'bg-slate-400'
                }`}
              />
              <span className="uppercase tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation modal before going offline */}
      <DutyToggleModal
        isOpen={dutyModalOpen}
        onClose={() => setDutyModalOpen(false)}
        onConfirm={() => executeDutyChange(false)}
        loading={loading}
      />
    </>
  )
}

export default Header
