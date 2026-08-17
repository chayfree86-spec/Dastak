import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type, title, message, duration = 3500) => {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setToasts((prev) => [...prev, { id, type, title, message }])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (title, message, duration) => addToast('success', title, message, duration),
    [addToast]
  )
  const error = useCallback(
    (title, message, duration) => addToast('error', title, message, duration),
    [addToast]
  )
  const info = useCallback(
    (title, message, duration) => addToast('info', title, message, duration),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start justify-between gap-3 text-xs backdrop-blur-md transition-all animate-in slide-in-from-top-2 ${
              t.type === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                : t.type === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : t.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-[#2845D6] dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className="font-black text-xs">{t.title}</h5>
                {t.message && <p className="opacity-90 mt-0.5 leading-snug">{t.message}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export default ToastContext
