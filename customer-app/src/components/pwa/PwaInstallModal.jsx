import React from 'react';
import { Download, Zap, Bell, Smartphone, Share2, PlusSquare, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function PwaInstallModal({
  appName = 'Dastak Food & Grocery',
  appRole = 'Food, Grocery & Essentials in 10-20 Mins',
  iconSrc = '/pwa-512x512.png',
  accentColor = 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
  accentBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
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
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => dismissModal(3)}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Header Card */}
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
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white dark:text-slate-950 p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide mb-2 border ${accentBadge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isInstalled ? 'App Ready' : 'Fast Delivery App'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {appName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {appRole}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Super Fast</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Quick browsing & checkout</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Instant Alerts</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live order status updates</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">Live Tracking</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time rider on map</span>
          </div>
        </div>

        {/* iOS Step-by-Step Helper */}
        {isIOS ? (
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Share2 className="w-4 h-4" />
              <span>How to Install on iPhone / iPad:</span>
            </div>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside font-medium">
              <li>Tap the <strong className="text-slate-900 dark:text-white">Share button</strong> <Share2 className="inline w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-0.5" /> in Safari browser.</li>
              <li>Scroll down & select <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-0.5" />.</li>
              <li>Tap <strong className="text-slate-900 dark:text-white">Add</strong> on the top right to finish.</li>
            </ol>
          </div>
        ) : null}

        {/* Action Buttons */}
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
                  <span>Install Dastak App</span>
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
          Free install • Zero phone storage drain (under 2 MB) • Lightning fast launch
        </p>
      </div>
    </div>
  );
}
