import React, { useState } from 'react'
import { AlertTriangle, XCircle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'

export const RejectReasonModal = ({ isOpen, onClose, order, onConfirm, loading }) => {
  const [selectedReason, setSelectedReason] = useState('Item out of stock / unavailable')
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState('')

  const quickReasons = [
    'Item out of stock / unavailable',
    'Kitchen too busy / overloaded',
    'Restaurant is closing / off-hours',
    'Delivery area / address unreachable',
    'Technical / operational issue',
    'Other reason',
  ]

  const handleConfirm = () => {
    setError('')
    const finalReason =
      selectedReason === 'Other reason'
        ? customReason.trim()
        : selectedReason

    if (!finalReason) {
      setError('Please provide a valid reason for rejecting this order.')
      return
    }

    onConfirm(order, finalReason)
  }

  if (!order) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Incoming Order"
      subtitle={`Why are you rejecting Order #${order.order_number}?`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Rejection Reason is Mandatory</p>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
              The customer will be notified with this reason and any online paid amount will be automatically refunded.
            </p>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          {quickReasons.map((reason) => {
            const isSelected = selectedReason === reason
            return (
              <div
                key={reason}
                onClick={() => {
                  setSelectedReason(reason)
                  setError('')
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-rose-400 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-1 ring-rose-400 dark:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span>{reason}</span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Custom text field if Other */}
        {selectedReason === 'Other reason' && (
          <div className="pt-1">
            <Input
              label="Enter Custom Reason"
              placeholder="e.g. Electricity outage in kitchen"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              error={error}
              required
            />
          </div>
        )}

        {/* Action buttons (Touch-friendly 48px height) */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center active:scale-98 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 active:scale-98 transition-all cursor-pointer select-none disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 stroke-[2.2]" />
            <span>Confirm Reject</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default RejectReasonModal
