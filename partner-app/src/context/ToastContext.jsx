import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, title, message, duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5)
    setToasts((prev) => [...prev, { id, type, title, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const toast = {
    success: (title, message) => addToast('success', title, message),
    error: (title, message) => addToast('error', title, message, 5000),
    warning: (title, message) => addToast('warning', title, message),
    info: (title, message) => addToast('info', title, message),
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Floating Toasts container */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[99999] flex flex-col gap-2.5 max-w-[92vw] sm:max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 transform transition-all duration-200 animate-in fade-in slide-in-from-top-2 backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10'
                : t.type === 'error'
                ? 'bg-white/95 border-rose-200 text-rose-900 shadow-rose-500/10'
                : t.type === 'warning'
                ? 'bg-white/95 border-amber-200 text-amber-900 shadow-amber-500/10'
                : 'bg-white/95 border-blue-200 text-blue-900 shadow-blue-500/10'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[#113BD0]" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{t.title}</h4>
              {t.message && <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
