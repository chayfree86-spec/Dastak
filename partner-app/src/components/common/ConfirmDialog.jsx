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
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        )
      case 'info':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-[#2845D6] mx-auto mb-4">
            <Info className="w-6 h-6" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={false}>
      <div className="text-center p-2">
        {getIcon()}
        <h4 className="text-base font-black text-slate-900 mb-1.5">{title}</h4>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading} className="w-28">
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="flex-1 shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
