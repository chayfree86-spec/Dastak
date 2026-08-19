import React from 'react';
import { Download, UtensilsCrossed, BellRing, Printer, Share2, PlusSquare, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function PwaInstallModal({
  appName = 'Dastak Restaurant Partner',
  appRole = 'Live Order Management & Kitchen Display System',
  iconSrc = '/pwa-512x512.png',
  accentColor = 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
  accentBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 transform transition-all duration-300 scale-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => dismissModal(3)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src={iconSrc}
              alt={appName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-xl border border-white/10 ring-4 ring-white/5"
              onError={(e) => {
                e.target.src = '/favicon.png';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-2 uppercase tracking-wide">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${accentBadge}`}>
                {isInstalled ? 'App Ready' : 'Merchant Portal'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {appName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {appRole}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
              <BellRing className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Loud Sound Alarm</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Never miss any incoming order</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Kitchen Display</span>
            <span className="text-[11px] text-slate-400 mt-0.5">1-Click accept & food prep</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white">Thermal Print</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Auto KOT receipt printing</span>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-slate-800/80 border border-blue-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Share2 className="w-4 h-4" />
              <span>How to Install on iPhone / iPad:</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Tap the <strong className="text-white">Share button</strong> <Share2 className="inline w-3.5 h-3.5 text-blue-400 mx-0.5" /> in Safari.</li>
              <li>Select <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-blue-400 mx-0.5" />.</li>
              <li>Tap <strong className="text-white">Add</strong> on the top right.</li>
            </ol>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isIOS && (
            <button
              onClick={handleActionClick}
              className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${accentColor}`}
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
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-medium text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
          >
            {isIOS ? 'Got It' : 'Maybe Later'}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          Free install • Keep screen awake enabled • Always instant sync
        </p>
      </div>
    </div>
  );
}
