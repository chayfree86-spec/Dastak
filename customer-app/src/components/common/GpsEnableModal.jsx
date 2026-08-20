import React, { useState } from 'react'
import {
  MapPinOff,
  Navigation,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  Smartphone,
  Compass,
} from 'lucide-react'
import { useLocationContext } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'

export const GpsEnableModal = ({ isOpen, onClose, onOpenPicker }) => {
  const { detectCurrentLocation } = useLocationContext()
  const toast = useToast()
  const [checking, setChecking] = useState(false)

  if (!isOpen) return null

  const handleRetry = async () => {
    setChecking(true)
    try {
      const detected = await detectCurrentLocation()
      toast.success(
        'GPS Activated Successfully',
        detected.address || 'Your current location has been updated.'
      )
      onClose()
    } catch (err) {
      toast.error(
        'GPS Still Unavailable',
        'Please turn on your phone GPS toggle and tap "Check GPS & Retry".'
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#113BD0] to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Animated Icon */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 shadow-xs">
              <MapPinOff className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#113BD0] text-white flex items-center justify-center shadow-md">
              <Compass className="w-3.5 h-3.5 animate-spin duration-3000" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Turn On Device Location (GPS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Your device GPS is currently switched off. Please turn on Location in your phone settings to see nearby restaurants and get live order tracking.
            </p>
          </div>
        </div>

        {/* Quick 2-Step Visual Guidance */}
        <div className="my-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
              1
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              Swipe down phone top bar / Settings & turn <strong className="text-slate-900 dark:text-white font-bold">"Location / GPS" ON</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
              2
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              Tap the <strong className="text-[#113BD0] dark:text-blue-400 font-bold">"Check GPS & Retry"</strong> button below.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {/* Primary Retry Button */}
          <button
            type="button"
            onClick={handleRetry}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-[#113BD0] hover:bg-[#1f37b5] active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#113BD0]/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Device GPS...' : 'Check GPS & Retry'}</span>
          </button>

          {/* Secondary Manual / Saved Address Option */}
          {onOpenPicker && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPicker()
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Saved Address / Enter Manually</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GpsEnableModal
