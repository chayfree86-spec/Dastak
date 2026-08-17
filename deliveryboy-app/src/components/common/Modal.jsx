import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  showClose = true,
  isBottomSheetOnMobile = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Dialog / Bottom Sheet Card */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-850 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 transform transition-all duration-200 max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95`}
      >
        {/* Mobile drag pill indicator */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        {(title || showClose) && (
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3 shrink-0">
            <div>
              {title && (
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
