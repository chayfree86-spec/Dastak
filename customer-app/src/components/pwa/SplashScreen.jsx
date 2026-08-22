import React, { useState, useEffect } from 'react'
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export const SplashScreen = ({ onFinish, forced = false }) => {
  const { isDark } = useTheme()
  const [fadeState, setFadeState] = useState('in')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Smooth progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 6
      })
    }, 60)

    // Snappy auto-dismiss after 1.8s
    let dismissTimer
    if (!forced) {
      dismissTimer = setTimeout(() => {
        handleDismiss()
      }, 1800)
    }

    return () => {
      clearInterval(progressInterval)
      if (dismissTimer) clearTimeout(dismissTimer)
    }
  }, [forced])

  const handleDismiss = () => {
    setFadeState('out')
    setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish()
      }
    }, 300)
  }

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] w-screen h-screen flex flex-col items-center justify-between transition-all duration-300 select-none overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-[#060D24] via-[#0B1736] to-[#040817] text-white'
          : 'bg-gradient-to-b from-[#F0F4FF] via-[#F8FAFC] to-white text-slate-900'
      } ${
        fadeState === 'out'
          ? 'opacity-0 scale-98 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'max(1.2rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      role="banner"
      aria-label="Dastak Mobile Splash Screen"
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-[#113BD0]/10 dark:bg-[#113BD0]/20 blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-[#FF5200]/10 dark:bg-[#FF5200]/20 blur-3xl pointer-events-none animate-pulse-soft" />

      {/* Top Header: Badge + Skip button */}
      <div className="w-full max-w-md px-5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#113BD0]/10 dark:bg-white/10 backdrop-blur-md border border-[#113BD0]/20 dark:border-white/15">
          <Zap className="w-3.5 h-3.5 text-[#FF5200] fill-[#FF5200]" />
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#113BD0] dark:text-blue-300">
            Fast Delivery
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer backdrop-blur-md border shadow-xs active:scale-95 bg-white/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-900"
          aria-label="Skip splash screen"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Graphic Canvas */}
      <div className="relative w-full max-w-md px-6 flex-1 flex flex-col items-center justify-center text-center my-auto z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full bg-gradient-to-tr from-[#113BD0]/15 to-[#FF5200]/15 blur-2xl animate-pulse" />
          
          <img
            src="/splash.png"
            alt="Dastak Splash"
            loading="eager"
            className="relative w-full max-w-[290px] sm:max-w-[320px] max-h-[44vh] object-contain drop-shadow-xl animate-in zoom-in-95 duration-500 pointer-events-none"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = '/splash-logo.png'
            }}
          />
        </div>
      </div>

      {/* Bottom Loading Progress & Trust */}
      <div className="w-full max-w-md px-6 space-y-3 relative z-20">
        <div className="w-full bg-slate-200/70 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden backdrop-blur-xs">
          <div
            className="h-full bg-gradient-to-r from-[#113BD0] via-[#3B82F6] to-[#FF5200] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Safe & Contactless Delivery</span>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
