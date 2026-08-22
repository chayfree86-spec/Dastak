import React, { useState, useEffect } from 'react'
import { Clock, X, Moon, BellRing } from 'lucide-react'

// Wrap time tokens (e.g. "11:00am", "8 PM", "22:00") in a highlighted span so
// the opening/closing times stand out inside any free-text message.
const highlightTimes = (text) => {
  if (!text) return text
  const re = /(\d{1,2}:\d{2}\s?(?:am|pm)?|\d{1,2}\s?(?:am|pm))/gi
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-black text-[#113BD0] dark:text-blue-400 whitespace-nowrap">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

/**
 * Shown when a customer tries to order while ordering is closed.
 * Displays the next opening time with a live countdown. Purely informational —
 * the customer can dismiss and keep browsing.
 */
export const StoreClosedModal = ({ isOpen, onClose, status, serverOffset = 0 }) => {
  const [remaining, setRemaining] = useState(null)

  const opensAt = status?.opens_at ? Date.parse(status.opens_at) : null

  useEffect(() => {
    if (!isOpen || !opensAt) {
      setRemaining(null)
      return
    }
    const tick = () => {
      // serverOffset corrects for a wrong client clock (server_time - client now).
      const now = Date.now() + serverOffset
      setRemaining(Math.max(0, opensAt - now))
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [isOpen, opensAt, serverOffset])

  if (!isOpen) return null

  const fmtUnit = (n) => String(n).padStart(2, '0')
  let cd = null
  if (remaining != null) {
    const totalSec = Math.floor(remaining / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    cd = { h, m, s }
  }

  const opensLabel = opensAt
    ? new Date(opensAt).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  const message =
    status?.message ||
    (status?.mode === 'scheduled' && status?.open_time
      ? `We're currently closed. Ordering opens daily at ${status.open_time}.`
      : 'Ordering is temporarily closed. Please check back soon.')

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-950/30 dark:shadow-black/80 overflow-hidden text-center"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#113BD0]/10 dark:bg-[#113BD0]/25 rounded-full blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#113BD0] to-indigo-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
          <Moon className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          We're closed right now
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-1.5 px-2">
          {highlightTimes(message)}
        </p>

        {/* Countdown */}
        {cd && (
          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-[#113BD0]" />
              <span>Opens in</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              {[
                { v: cd.h, l: 'Hours' },
                { v: cd.m, l: 'Min' },
                { v: cd.s, l: 'Sec' },
              ].map((u, i) => (
                <React.Fragment key={u.l}>
                  {i > 0 && <span className="text-2xl font-black text-slate-300 dark:text-slate-600 -mt-4">:</span>}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-2xl font-black tabular-nums shadow-inner">
                      {fmtUnit(u.v)}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{u.l}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {opensLabel && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#113BD0] dark:text-blue-400 text-xs font-black">
            <BellRing className="w-3.5 h-3.5" />
            <span>Opens {opensLabel}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs sm:text-sm transition-colors cursor-pointer"
        >
          Okay, I'll browse for now
        </button>
      </div>
    </div>
  )
}

export default StoreClosedModal
