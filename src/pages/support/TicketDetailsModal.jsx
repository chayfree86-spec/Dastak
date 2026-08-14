import React, { useState } from 'react'
import { Send, User, Store, Bike, AlertCircle, CheckCircle2 } from 'lucide-react'
import supportApi from '../../api/support.api'
import { formatDateTime } from '../../utils/formatters'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import { useToast } from '../../context/ToastContext'

export const TicketDetailsModal = ({
  ticket,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const toast = useToast()
  const [replyText, setReplyText] = useState('')
  const [status, setStatus] = useState(ticket?.status || 'OPEN')
  const [loading, setLoading] = useState(false)

  if (!ticket) return null

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setLoading(true)
    try {
      await supportApi.sendTicketReply(ticket.id, { message: replyText })
      toast.success('Reply Sent', 'Your response has been communicated to the customer.')
      setReplyText('')
      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to send reply.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    try {
      await supportApi.updateTicketStatus(ticket.id, { status: newStatus })
      toast.success('Status Updated', `Ticket #${ticket.id} status changed to ${newStatus}.`)
      if (onUpdated) onUpdated()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update status.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket #${ticket.id}: ${ticket.subject}`}
      subtitle={`Created on ${formatDateTime(ticket.created_at)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Ticket Metadata Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Customer: <strong className="text-slate-800 dark:text-slate-200">{ticket.customer_name}</strong></span>
            {ticket.order_id && (
              <span className="text-slate-400">Related Order: <strong className="text-[#2845D6] dark:text-blue-400 font-mono">#{ticket.order_id}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <CustomSelect
              value={status}
              onChange={handleStatusChange}
              className="w-36"
              options={[
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
              ]}
            />
          </div>
        </div>

        {/* Message Thread */}
        <div className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="font-bold text-slate-700 dark:text-slate-300">{ticket.customer_name}</span>
              <span>{formatDateTime(ticket.created_at)}</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{ticket.message}</p>
          </div>

          {ticket.admin_reply && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs space-y-1 ml-4">
              <div className="flex items-center justify-between text-blue-500 text-[10px]">
                <span className="font-bold">Dastak Support Admin</span>
                <span>{formatDateTime(ticket.replied_at || new Date().toISOString())}</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{ticket.admin_reply}</p>
            </div>
          )}
        </div>

        {/* Reply Composer */}
        <form onSubmit={handleSendReply} className="space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your official administrative resolution or response..."
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
          />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Send} loading={loading}>
              Send Resolution
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default TicketDetailsModal
