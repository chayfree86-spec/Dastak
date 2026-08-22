import React from 'react'
import {
  Download,
  Navigation,
  ShieldCheck,
  Banknote,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { usePwaInstall } from '../../hooks/usePwaInstall'

export function PwaInstallModal({
  appName = 'Dastak Delivery Partner',
  appRole = 'Live Delivery & Rider Order Fulfilment App',
  iconSrc = '/pwa-512x512.png',
  accentColor = 'bg-gradient-to-r from-[#113BD0] to-[#1E3A8A] hover:from-[#0F32B5] hover:to-[#172554] text-white shadow-lg shadow-blue-600/35',
  accentBadge = 'bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
}) {
  const {
    showModal,
    isStandalone,
    isIOS,
    isInstalled,
    promptInstall,
    dismissModal,
  } = usePwaInstall()

  if (!showModal || isStandalone) {
    return null
  }

  const handleActionClick = async () => {
    if (isInstalled) {
      window.location.href = '/'
      dismissModal(14)
      return
    }
    await promptInstall()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-950/20 dark:shadow-black/80 transform transition-all duration-200 overflow-hidden text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient subtle glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => dismissModal(3)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="flex items-center gap-3.5 pr-8 mb-4">
          <div className="relative shrink-0">
            <img
              src={iconSrc}
              alt={appName}
              className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-700 ring-2 ring-blue-500/20"
              onError={(e) => {
                e.target.src = '/favicon.png'
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border mb-1 ${accentBadge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#113BD0] animate-pulse" />
              {isInstalled ? 'App Installed' : 'Official Rider App'}
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight">
              {appName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {appRole}
            </p>
          </div>
        </div>

        {/* Compact 3-Pill Feature Strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center text-center">
            <Navigation className="w-4 h-4 text-[#113BD0] dark:text-blue-400 mb-1" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Live GPS</span>
            <span className="text-[9px] text-slate-400">Routes</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center text-center">
            <Banknote className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Daily Cash</span>
            <span className="text-[9px] text-slate-400">Earnings</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 flex flex-col items-center text-center">
            <ShieldCheck className="w-4 h-4 text-blue-500 mb-1" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Fast OTP</span>
            <span className="text-[9px] text-slate-400">Verify</span>
          </div>
        </div>

        {/* iOS Guided Install Instructions */}
        {isIOS ? (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-3.5 mb-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#113BD0] dark:text-blue-400 font-bold mb-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Install on iPhone:</span>
            </div>
            <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
              <li>Tap <strong>Share</strong> in Safari.</li>
              <li>Select <strong>Add to Home Screen</strong>.</li>
            </ol>
          </div>
        ) : null}

        {/* Large Prominent Rider Blue Button */}
        <div className="space-y-2">
          {!isIOS && (
            <button
              type="button"
              onClick={handleActionClick}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer ${accentColor}`}
            >
              {isInstalled ? (
                <>
                  <ExternalLink className="w-5 h-5" />
                  <span>Open Rider App</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>Install Delivery App</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => dismissModal(isIOS ? 7 : 3)}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isIOS ? 'Got It' : 'Maybe Later'}
          </button>
        </div>

        {/* Bottom Trust Micro-Label */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
          Free install • Offline support • Instant alerts
        </p>
      </div>
    </div>
  )
}

export default PwaInstallModal
