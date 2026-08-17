import React, { useState } from 'react'
import { CheckCircle2, ShieldCheck, Banknote, AlertCircle, KeyRound } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import Modal from '../common/Modal'
import Button from '../common/Button'
import OtpInput from '../common/OtpInput'
import deliveryApi from '../../api/delivery.api'
import { useToast } from '../../context/ToastContext'

export const OtpVerifyModal = ({ isOpen, onClose, order, onSuccess }) => {
  const toast = useToast()
  const [otp, setOtp] = useState('')
  const [cashCollected, setCashCollected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!order) return null

  const isCod = order.payment_mode === 'COD' || order.payment_mode === 'CASH_ON_DELIVERY'
  const totalAmount = order.bill?.total_amount || order.total_amount || 0

  const handleVerify = async (e) => {
    e?.preventDefault()
    setError('')

    // 1. Validation for COD: Cash collection must be confirmed (No OTP needed)
    if (isCod) {
      if (!cashCollected) {
        setError('Please check the box confirming you have collected the cash from customer.')
        return
      }
    } else {
      // 2. Validation for Online Paid: 4-digit OTP is mandatory
      if (!otp || otp.trim().length < 4) {
        setError('Please enter the 4-digit delivery verification OTP provided by the customer.')
        return
      }
    }

    setLoading(true)
    try {
      await deliveryApi.verifyDelivery(order.order_number, {
        otp: isCod ? undefined : otp.trim(),
        cash_collected: isCod ? true : undefined,
      })
      toast.success(
        'Delivery Completed!',
        `Order #${order.order_number} marked delivered. ${isCod ? 'Cash added to COD ledger.' : ''}`
      )
      setOtp('')
      setCashCollected(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'Delivery completion failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCod ? 'Confirm Cash Collection' : 'Verify Customer Delivery OTP'}
      subtitle={`Order #${order.order_number}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {/* ========================================================================= */}
        {/* Case A: COD Order (NO OTP, Cash collection confirmation only)             */}
        {/* ========================================================================= */}
        {isCod ? (
          <div className="space-y-3">
            <div className="p-5 rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 text-amber-950 dark:text-amber-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Banknote className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                    CASH ON DELIVERY (NO OTP REQUIRED)
                  </span>
                  <div className="text-2xl font-black text-amber-950 dark:text-amber-100">
                    Collect {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 pt-3 border-t border-amber-300/50 dark:border-amber-700/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cashCollected}
                  onChange={(e) => {
                    setCashCollected(e.target.checked)
                    setError('')
                  }}
                  className="w-5 h-5 rounded-lg border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-black text-amber-950 dark:text-amber-100 leading-snug">
                  I have collected {formatCurrency(totalAmount)} cash in hand from customer
                </span>
              </label>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* Case B: Online Paid Order (Mandatory 4-Digit Customer OTP)                */
          /* ========================================================================= */
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block">
                  ONLINE PAID ORDER
                </span>
                <span className="text-xs font-bold">
                  Payment already received online. Ask customer for 4-digit Delivery OTP.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Enter 4-digit Delivery OTP given by customer
              </span>
              <OtpInput length={4} value={otp} onChange={setOtp} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            size="md"
            icon={CheckCircle2}
            loading={loading}
            className="flex-1 shadow-md font-bold"
          >
            {isCod ? 'YES, CASH COLLECTED — DELIVER' : 'VERIFY OTP & COMPLETE'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default OtpVerifyModal
