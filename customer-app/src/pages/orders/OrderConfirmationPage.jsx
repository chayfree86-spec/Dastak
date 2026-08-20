import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  XCircle,
  Store,
  MapPin,
  CreditCard,
  Banknote,
  Receipt,
  UtensilsCrossed,
  AlertTriangle,
  FastForward,
  RotateCcw,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(300) // Default 5 mins (300 seconds)
  const [totalWindow, setTotalWindow] = useState(300)
  const [isFinalized, setIsFinalized] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Ordered by mistake')
  const [cancelling, setCancelling] = useState(false)

  const cancelReasons = [
    { id: 'mistake', label: 'Ordered by mistake' },
    { id: 'address', label: 'Incorrect delivery address selected' },
    { id: 'items', label: 'Need to change items or quantity' },
    { id: 'delay', label: 'Expected delivery time is too long' },
    { id: 'other', label: 'Other reason' },
  ]

  // 1. Fetch Order Details & Calculate True Countdown
  useEffect(() => {
    let isMounted = true

    const fetchOrder = async () => {
      setLoading(true)
      try {
        const res = await customerApi.getOrder(orderNumber)
        const orderData = res.data?.data || res.data || {}
        if (!isMounted) return

        setOrder(orderData)

        // Calculate cancel window from backend settings (default 5 minutes)
        const windowSecs =
          orderData.cancel_window_seconds ||
          (orderData.cancel_window_minutes ? orderData.cancel_window_minutes * 60 : 300)
        setTotalWindow(windowSecs)

        // Calculate remaining seconds based on placed_at / created_at timestamp
        const placedTime = new Date(
          orderData.timelines?.placed_at || orderData.created_at || Date.now()
        ).getTime()
        const now = Date.now()
        const elapsedSecs = Math.floor((now - placedTime) / 1000)
        const remaining = Math.max(0, windowSecs - elapsedSecs)

        setTimeLeft(remaining)

        // If time already expired or order cancelled/preparing, mark finalized
        if (remaining <= 0 || orderData.status !== 'PLACED' || !orderData.can_cancel) {
          setIsFinalized(true)
        }
      } catch (err) {
        console.warn('Failed to load confirmation order:', err)
        toast.error('Error', 'Unable to retrieve order confirmation details.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOrder()

    return () => {
      isMounted = false
    }
  }, [orderNumber])

  // 2. Real-Time 1-Second Decrement Countdown Timer
  useEffect(() => {
    if (loading || isFinalized || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, isFinalized, timeLeft])

  // 3. Handle Auto Finalize on Timer Expiry
  const handleTimeExpired = () => {
    setIsFinalized(true)
    toast.success(
      'Order Sent to Kitchen!',
      `Order #${orderNumber} is now being prepared.`
    )
    setTimeout(() => {
      navigate(`/orders/${orderNumber}`, { replace: true })
    }, 1200)
  }

  // 4. Handle Skip Countdown (Send to Kitchen Immediately)
  const handleSkipCountdown = () => {
    setIsFinalized(true)
    toast.success(
      'Order Finalized!',
      `Order #${orderNumber} sent to ${order?.restaurant?.name || 'kitchen'} immediately.`
    )
    navigate(`/orders/${orderNumber}`, { replace: true })
  }

  // 5. Handle Cancel Order
  const handleCancelSubmit = async () => {
    setCancelling(true)
    try {
      await customerApi.cancelOrder(orderNumber, cancelReason)
      setCancelModalOpen(false)
      toast.info(
        'Order Cancelled',
        `Order #${orderNumber} has been cancelled successfully.`
      )
      navigate('/orders', { replace: true })
    } catch (err) {
      toast.error('Cancellation Failed', err.message || 'Could not cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  // Format MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // SVG circular progress calculation
  const strokeDashoffset =
    totalWindow > 0 ? ((totalWindow - timeLeft) / totalWindow) * 283 : 0

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
          Order Details Not Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We could not load this order. It may have been completed or removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-24 animate-in fade-in duration-300">
      {/* 1. Header Success Banner */}
      <div className="text-center space-y-2 pt-2 sm:pt-4">
        <div className="relative inline-flex items-center justify-center">
          <span className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Order Placed Successfully!
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
            Order ID: <span className="text-[#FF5200] font-black">#{order.order_number}</span> •{' '}
            {formatDateTime(order.created_at || order.placed_at)}
          </p>
        </div>
      </div>

      {/* 2. Cancellation Grace Window & Live Countdown Timer Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-orange-50/80 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-2 border-orange-200/80 dark:border-orange-950/60 shadow-xl shadow-orange-500/10 text-center space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF5200] via-amber-400 to-[#FF5200]" />

        {/* Spacious Circular Progress & Digital Countdown */}
        <div className="relative inline-flex items-center justify-center my-1">
          <svg className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Depleting Orange Accent Ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-[#FF5200] transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray="440"
              strokeDashoffset={totalWindow > 0 ? ((totalWindow - timeLeft) / totalWindow) * 440 : 0}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Time (Zero Overlap) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center mb-1">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono leading-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-black uppercase text-[#FF5200] dark:text-orange-400 bg-orange-100/80 dark:bg-orange-950/80 px-2.5 py-0.5 rounded-full mt-1.5 tracking-wider">
              {timeLeft > 0 ? 'Grace Window' : 'Finalized'}
            </span>
          </div>
        </div>

        {/* Informative Guidance Text */}
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200">
            {timeLeft > 0
              ? 'Order is in grace period'
              : 'Grace window ended! Order sent to kitchen.'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {timeLeft > 0
              ? `You can cancel or modify your order in this window. When the timer hits 00:00, it will automatically lock and go directly to ${order.restaurant?.name || 'the kitchen'}.`
              : `The kitchen is now preparing your delicious meal. You cannot cancel this order anymore.`}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {timeLeft > 0 && !isFinalized ? (
            <>
              {/* Skip Countdown Button */}
              <Button
                variant="primary"
                size="lg"
                icon={FastForward}
                onClick={handleSkipCountdown}
                className="w-full sm:w-auto px-6 py-3.5 shadow-lg shadow-orange-500/30 text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center"
              >
                Send to {((order.restaurant?.name || 'Kitchen').length > 14 ? (order.restaurant?.name).slice(0, 14).trim() + '…' : (order.restaurant?.name || 'Kitchen'))} Now →
              </Button>

              {/* Cancel Order Button */}
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-xs"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => navigate(`/orders/${orderNumber}`)}
              className="w-full sm:w-auto px-8 py-3.5 shadow-xl shadow-orange-500/35 text-sm font-black"
            >
              Track Live Order →
            </Button>
          )}
        </div>
      </div>

      {/* 3. Order Summary & Bill Breakdown Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-black text-sm">
            <UtensilsCrossed className="w-4 h-4 text-[#FF5200]" />
            <span>Order Summary</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {order.items?.length || 0} {order.items?.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Restaurant Header */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
              {order.restaurant?.name || 'Dastak Partner Kitchen'}
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {order.restaurant?.address || 'Fast kitchen outlet'}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between pt-2 first:pt-0 text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <span className="w-5 h-5 rounded-md bg-orange-50 dark:bg-slate-800 text-[#FF5200] font-black text-[11px] flex items-center justify-center shrink-0">
                  {item.quantity}x
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {item.name || item.menu_item?.name}
                </span>
              </div>
              <span className="font-black text-slate-900 dark:text-slate-100 shrink-0">
                {formatCurrency(Number(item.price || item.unit_price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Bill Total Strip */}
        <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">Total Amount</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {order.payment_mode === 'COD' ? (
                <>
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cash on Delivery</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-[#FF5200]" />
                  <span>Online Paid</span>
                </>
              )}
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#FF5200] dark:text-orange-400">
            {formatCurrency(order.bill?.total_amount || order.total_amount || 0)}
          </span>
        </div>

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-black text-slate-800 dark:text-slate-200 block">
                Delivery Address:
              </span>
              <p className="line-clamp-2 text-slate-500 dark:text-slate-400">
                {typeof order.delivery_address === 'string'
                  ? order.delivery_address
                  : `${order.delivery_address.flat_or_building || ''}, ${
                      order.delivery_address.area || order.delivery_address.landmark || ''
                    }`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Cancel Order Reason Selection Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order Confirmation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
              <span className="font-black block">Are you sure you want to cancel?</span>
              <p>
                This order #{orderNumber} will be cancelled immediately and refunded if paid online.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              Please select reason for cancellation:
            </label>
            <div className="space-y-1.5">
              {cancelReasons.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setCancelReason(r.label)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer select-none text-xs font-bold ${
                    cancelReason === r.label
                      ? 'border-[#FF5200] bg-orange-50/60 dark:bg-slate-800 text-[#FF5200] dark:text-orange-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReason === r.label}
                    onChange={() => setCancelReason(r.label)}
                    className="accent-[#FF5200] w-4 h-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              size="md"
              icon={XCircle}
              loading={cancelling}
              onClick={handleCancelSubmit}
              className="font-black shadow-lg shadow-rose-600/25"
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OrderConfirmationPage
