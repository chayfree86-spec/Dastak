import React, { useState } from 'react'
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import deliveryApi from '../../api/delivery.api'
import { useToast } from '../../context/ToastContext'

const ISSUE_REASONS = [
  'Customer unreachable / Phone switched off',
  'Incorrect / Incomplete delivery address',
  'Customer requested delivery cancellation',
  'Restaurant packaging or item issue',
  'Vehicle breakdown / Flat tire',
  'Heavy rain / Traffic roadblock',
  'Other operational issue',
]

export const ReportIssueModal = ({ isOpen, onClose, order }) => {
  const toast = useToast()
  const [reason, setReason] = useState(ISSUE_REASONS[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  if (!order) return null

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      await deliveryApi.reportIssue({
        subject: `Delivery Issue: Order #${order.order_number} - ${reason}`,
        description: `Rider reported issue: ${reason}. Additional details: ${description || 'N/A'}. Order ID: ${order.id}`,
        category: 'DELIVERY',
        priority: 'HIGH',
      })
      toast.success(
        'Issue Reported to Dispatch',
        'Support team and restaurant manager have been alerted.'
      )
      setDescription('')
      onClose()
    } catch (err) {
      toast.error('Failed to submit report', err.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Delivery Issue"
      subtitle={`Order #${order.order_number}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Issue Category <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-1.5">
            {ISSUE_REASONS.map((r) => (
              <label
                key={r}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  reason === r
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-[#113BD0] dark:border-blue-500 text-[#113BD0] dark:text-blue-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="issue_reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="w-4 h-4 text-[#113BD0] focus:ring-[#113BD0]"
                />
                <span className="text-xs leading-snug">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Additional Comments (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain briefly what happened..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/20 focus:border-[#113BD0]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="md"
            icon={Send}
            loading={loading}
            className="shadow-md"
          >
            Submit to Support
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ReportIssueModal
