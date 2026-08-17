import React from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { Power, AlertCircle } from 'lucide-react'

export const DutyToggleModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={false} maxWidth="max-w-sm">
      <div className="text-center p-2 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <Power className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
            Go Offline?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You will stop receiving new delivery assignments and trip alerts from the platform.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Stay Online
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="flex-1 shadow-md"
          >
            Go Offline
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DutyToggleModal
