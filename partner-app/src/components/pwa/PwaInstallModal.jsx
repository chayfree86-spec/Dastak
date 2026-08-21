import React from 'react';
import { Download, UtensilsCrossed, BellRing, Printer, Share2, PlusSquare, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function PwaInstallModal({
  appName = 'Dastak Restaurant Partner',
  appRole = 'Live Order Management & Kitchen Display System',
  iconSrc = '/pwa-512x512.png',
  accentColor = 'bg-[#113BD0] hover:bg-[#1E3A8A] text-white shadow-blue-600/30',
  accentBadge = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
}) {
  const {
    showModal,
    isStandalone,
    isIOS,
    isInstalled,
    promptInstall,
    dismissModal
  } = usePwaInstall();

  if (!showModal || isStandalone) {
    return null;
  }

  const handleActionClick = async () => {
    if (isInstalled) {
      window.location.href = '/';
      dismissModal(14);
      return;
    }
    await promptInstall();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/15 dark:shadow-black/80 transform transition-all duration-300 scale-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => dismissModal(3)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src={iconSrc}
              alt={appName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-xl border border-slate-200 dark:border-white/10 ring-4 ring-slate-100 dark:ring-white/5"
              onError={(e) => {
                e.target.src = '/favicon.png';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide mb-2 border ${accentBadge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {isInstalled ? 'App Ready' : 'Merchant Portal'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {appName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {appRole}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <BellRing className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Loud Sound Alarm</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Never miss any incoming order</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Kitchen Display</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1-Click accept & food prep</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Thermal Print</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Auto KOT receipt printing</span>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Share2 className="w-4 h-4" />
              <span>How to Install on iPhone / iPad:</span>
            </div>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside font-medium">
              <li>Tap the <strong className="text-slate-900 dark:text-white">Share button</strong> <Share2 className="inline w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-0.5" /> in Safari.</li>
              <li>Select <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-0.5" />.</li>
              <li>Tap <strong className="text-slate-900 dark:text-white">Add</strong> on the top right.</li>
            </ol>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isIOS && (
            <button
              onClick={handleActionClick}
              className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${accentColor}`}
            >
              {isInstalled ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in App</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Install Partner App</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => dismissModal(isIOS ? 7 : 3)}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {isIOS ? 'Got It' : 'Maybe Later'}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 font-medium">
          Free install • Keep screen awake enabled • Always instant sync
        </p>
      </div>
    </div>
  );
}
