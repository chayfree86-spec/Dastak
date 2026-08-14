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
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )
      case 'info':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-[#2845D6] dark:text-blue-400 mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
        )
    }
  }

  const getButtonVariant = () => {
    if (type === 'danger') return 'danger'
    if (type === 'success') return 'primary'
    return 'primary'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={false}>
      <div className="text-center">
        {getIcon()}
        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={getButtonVariant()} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
