import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react'

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )
      case 'info':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-[#113BD0] dark:text-blue-400 mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
        )
    }
  }

  const getButtonVariant = () => {
    if (type === 'danger') return 'danger'
    if (type === 'success') return 'success'
    return 'primary'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={false} zIndex="z-[10010]">
      <div className="text-center p-2">
        {getIcon()}
        <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1.5">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all cursor-pointer select-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`h-12 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md active:scale-98 transition-all cursor-pointer select-none ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                : type === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : 'bg-[#113BD0] hover:bg-[#1E3A8A] shadow-blue-500/25'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
