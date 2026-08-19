import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bike,
  Store,
  Phone,
  AlertTriangle,
  Receipt,
  User,
  MapPin,
  XCircle,
  Star,
  FastForward,
  UtensilsCrossed,
  Banknote,
  CreditCard,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime, formatTime, getOrderStatusText } from '../../utils/formatters'
import { makePhoneCall } from '../../utils/geo'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import RatingModal from '../../components/common/RatingModal'
import LiveOrderTrackingMap from '../../components/orders/LiveOrderTrackingMap'
import { realtimeBus } from '../../utils/realtimeSync'

export const OrderTrackingPage = () => {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Placed by mistake')
  const [cancelling, setCancelling] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(null)
  const [countdownSkipped, setCountdownSkipped] = useState(false)
  const [liveTelemetry, setLiveTelemetry] = useState({ distanceKm: 1.4, etaMins: 6 })
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  const cancelReasons = [
    { id: 'mistake', label: 'Ordered by mistake' },
    { id: 'address', label: 'Incorrect delivery address selected' },
    { id: 'items', label: 'Need to change items or quantity' },
    { id: 'delay', label: 'Expected delivery time is too long' },
    { id: 'other', label: 'Other reason' },
  ]

  const fetchOrder = useCallback(async () => {
    try {
      const res = await customerApi.getOrder(orderNumber)
      const data = res.data?.data || res.data || {}
      setOrder(data)

      if (data.reviews?.length > 0 || data.review || data.is_reviewed) {
        setReviewed(true)
      }

      // Calculate 5-minute cancellation window from placed_at
      const windowSecs =
        data.cancel_window_seconds ||
        (data.cancel_window_minutes ? data.cancel_window_minutes * 60 : 300)
      const placedTime = new Date(data.timelines?.placed_at || data.placed_at || data.created_at).getTime()
      const diffSecs = Math.max(0, Math.floor((placedTime + windowSecs * 1000 - Date.now()) / 1000))
      setSecondsRemaining(diffSecs)
    } catch (e) {
      console.warn('Failed to load order:', e)
    } finally {
      setLoading(false)
    }
  }, [orderNumber])

  useEffect(() => {
    fetchOrder()

    // 0ms Realtime status sync
    const unsubscribe = realtimeBus.subscribe(() => {
      fetchOrder()
    })

    const handleFocus = () => fetchOrder()
    window.addEventListener('focus', handleFocus)

    const interval = setInterval(fetchOrder, 6000)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [fetchOrder])

  // Countdown timer for cancellation
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsRemaining])

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      await customerApi.cancelOrder(orderNumber, cancelReason)
      toast.success('Order Cancelled', 'Your order has been cancelled successfully.')
      setCancelModalOpen(false)
      fetchOrder()
    } catch (err) {
      toast.error('Cancel Failed', err.message || 'Unable to cancel order at this stage.')
    } finally {
      setCancelling(false)
    }
  }

  const handleSkipTimer = () => {
    setCountdownSkipped(true)
    toast.success('Order Finalized!', `Order #${orderNumber} sent to kitchen.`)
  }

  if (loading) {
    return <LoadingSkeleton count={3} />
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-400">
        Order not found.
      </div>
    )
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED'
  const isDelivered = order.status === 'DELIVERED'
  const isPendingGrace =
    !isCancelled &&
    !isDelivered &&
    !countdownSkipped &&
    secondsRemaining > 0 &&
    (order.status === 'PENDING' || order.status === 'PLACED')

  const deliveryBoy = order.delivery_boy || {}
  const restaurant = order.restaurant || {}
  const items = order.items || []
  const bill = order.bill || {}

  // Format MM:SS
  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const strokeDashoffset =
    300 > 0 ? ((300 - (secondsRemaining || 0)) / 300) * 283 : 0

  // =========================================================================
  // VIEW 1: FULL PAGE COUNTDOWN & CANCELLATION SCREEN (During 5-min Grace Window)
  // =========================================================================
  if (isPendingGrace) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-24 animate-in fade-in duration-300">
        {/* Top Header Navigation */}
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#FF5200] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'ऑर्डर्स पर वापस जाएं' : 'Back to Orders'}</span>
        </button>

        {/* 1. Header Success Banner */}
        <div className="text-center space-y-2 pt-1 sm:pt-3">
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
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#FF5200] via-amber-400 to-[#FF5200]" />

          {/* Spacious Circular Progress & Digital Countdown */}
          <div className="relative inline-flex items-center justify-center my-1">
            <svg className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                className="text-[#FF5200] transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="440"
                strokeDashoffset={((300 - Math.min(300, secondsRemaining || 0)) / 300) * 440}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Clean Center Digital Time (Zero Overlap) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center mb-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono leading-tight">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-[10px] font-black uppercase text-[#FF5200] dark:text-orange-400 bg-orange-100/80 dark:bg-orange-950/80 px-2.5 py-0.5 rounded-full mt-1.5 tracking-wider">
                Grace Window
              </span>
            </div>
          </div>

          {/* Informative Guidance Text */}
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200">
              Order is in grace period
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              You can cancel or modify your order in this window. When the timer hits 00:00, it will automatically lock and go directly to {restaurant.name || 'the kitchen'}.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={FastForward}
              onClick={handleSkipTimer}
              className="w-full sm:w-auto px-6 py-3.5 shadow-lg shadow-orange-500/30 text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center"
            >
              Send to {((restaurant.name || order.restaurant?.name || 'Kitchen').length > 14 ? (restaurant.name || order.restaurant?.name).slice(0, 14).trim() + '…' : (restaurant.name || order.restaurant?.name || 'Kitchen'))} Now →
            </Button>

            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 shadow-xs"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Order</span>
            </button>
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
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {restaurant.name || 'Dastak Partner Kitchen'}
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {restaurant.address || 'Fast kitchen outlet'}
              </p>
            </div>
          </div>

          <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pt-2 first:pt-0 text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <span className="w-5 h-5 rounded-md bg-orange-50 dark:bg-slate-800 text-[#FF5200] font-black text-[11px] flex items-center justify-center shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.name || item.item_name || item.menu_item?.name}
                  </span>
                </div>
                <span className="font-black text-slate-900 dark:text-slate-100 shrink-0">
                  {formatCurrency(Number(item.price || item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

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
              {formatCurrency(bill.total_amount || order.total_amount || 0)}
            </span>
          </div>

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
                    : `${order.delivery_address.address_line1 || order.delivery_address.flat_or_building || ''}, ${
                        order.delivery_address.city || ''
                      }`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cancellation Modal */}
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
                onClick={handleCancelOrder}
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

  // =========================================================================
  // VIEW 2: FULL LIVE ORDER TRACKING SCREEN (Map, Rider, OTP, Timeline)
  // =========================================================================

  // Timeline Steps with i18n
  const steps = [
    {
      id: 'PLACED',
      label: lang === 'hi' ? 'ऑर्डर दर्ज हुआ' : 'Order Placed',
      desc: lang === 'hi' ? 'ऑर्डर प्राप्त हुआ और रेस्टोरेंट को भेजा गया' : 'Order received and sent to restaurant',
      isDone: true,
      time: order.timelines?.placed_at,
    },
    {
      id: 'CONFIRMED',
      label: lang === 'hi' ? 'रेस्टोरेंट ने स्वीकार किया' : 'Restaurant Accepted',
      desc: lang === 'hi' ? 'रेस्टोरेंट ने आपका ऑर्डर स्वीकार कर लिया है' : 'Restaurant accepted your order',
      isDone: [
        'CONFIRMED',
        'PREPARING',
        'READY_FOR_PICKUP',
        'ASSIGNED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ].includes(order.status),
      time: order.timelines?.confirmed_at,
    },
    {
      id: 'PREPARING',
      label: lang === 'hi' ? 'खाना तैयार हो रहा है' : 'Kitchen Preparing Food',
      desc: lang === 'hi' ? 'ताज़ा सामग्री से भोजन पकाया जा रहा है' : 'Fresh ingredients being cooked',
      isDone: [
        'PREPARING',
        'READY_FOR_PICKUP',
        'ASSIGNED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ].includes(order.status),
      time: order.timelines?.preparing_at,
    },
    {
      id: 'OUT_FOR_DELIVERY',
      label: lang === 'hi' ? 'पिकअप हुआ और रास्ते में है' : 'Picked Up & On the Way',
      desc: lang === 'hi' ? 'डिलीवरी पार्टनर आपकी लोकेशन की ओर निकल चुका है' : 'Delivery partner on the way to your location',
      isDone: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
      time: order.timelines?.dispatched_at,
    },
    {
      id: 'DELIVERED',
      label: lang === 'hi' ? 'सफलतापूर्वक पहुँच गया' : 'Delivered',
      desc: lang === 'hi' ? 'ऑर्डर आपके पते पर डिलीवर हो गया' : 'Package delivered to your address',
      isDone: order.status === 'DELIVERED',
      time: order.timelines?.delivered_at,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Top Navigation */}
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2845D6] dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{lang === 'hi' ? 'ऑर्डर्स पर वापस जाएं' : 'Back to Orders'}</span>
      </button>

      {/* 2. Main Live Status Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF5200] text-white px-2.5 py-0.5 rounded-lg">
                #{order.order_number}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(order.placed_at || order.created_at)}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {getOrderStatusText(order.status, lang)}
            </h3>
          </div>

          {/* Estimated Time Badge - Live Updating */}
          {!isDelivered && !isCancelled && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-tr from-orange-50 to-amber-50/80 dark:from-slate-900 dark:to-slate-800 border-2 border-orange-200 dark:border-orange-900/60 text-center shrink-0 min-w-[130px] shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5200]">
                  {order.status === 'OUT_FOR_DELIVERY'
                    ? lang === 'hi' ? 'लाइव आगमन' : 'LIVE ARRIVAL'
                    : t.estimatedArrival}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {order.status === 'OUT_FOR_DELIVERY'
                  ? liveTelemetry.etaMins <= 1
                    ? lang === 'hi' ? 'बस पहुँचने वाला है!' : 'Arriving Now!'
                    : `~${liveTelemetry.etaMins} ${lang === 'hi' ? 'मिनट' : 'Mins'}`
                  : `~${order.estimated_delivery_minutes || 25} ${lang === 'hi' ? 'मिनट' : 'Mins'}`}
              </div>
              {order.status === 'OUT_FOR_DELIVERY' && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {liveTelemetry.distanceKm} {lang === 'hi' ? 'किमी दूर' : 'km away'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delivered Experience & Rating Banner */}
        {isDelivered && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-indigo-500/10 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block tracking-wider">
                  {lang === 'hi' ? 'भोजन व डिलीवरी अनुभव' : 'MEAL & DELIVERY EXPERIENCE'}
                </span>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {reviewed
                    ? (lang === 'hi' ? 'रेटिंग दर्ज हो चुकी है' : 'Rating Submitted for this Order')
                    : (t.rateFoodAndDelivery || 'Rate Restaurant & Delivery Rider')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {reviewed
                    ? (lang === 'hi' ? 'फीडबैक देने के लिए बहुत-बहुत धन्यवाद!' : 'Thank you for sharing your feedback!')
                    : (t.rateExperienceSubtitle || 'Share your feedback for restaurant and rider')}
                </p>
              </div>
            </div>

            {!reviewed ? (
              <button
                type="button"
                onClick={() => setRatingModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#2845D6] hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{t.rateOrder || (lang === 'hi' ? 'रेटिंग दें' : 'Rate Order')}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.alreadyReviewed || (lang === 'hi' ? 'रेटिंग पूर्ण' : 'Reviewed')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Live Interactive Delivery Route Map (Live Rider with Bike Marker) */}
      {!isCancelled && (
        <LiveOrderTrackingMap order={order} onEtaChange={setLiveTelemetry} />
      )}

      {/* 4. Visual Step-by-Step Timeline */}
      {!isCancelled && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {lang === 'hi' ? 'डिलीवरी प्रगति' : 'DELIVERY PROGRESS'}
          </h4>

          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex items-start gap-4 text-xs">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 z-10 ${
                    step.isDone
                      ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {step.isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`font-black ${
                        step.isDone
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h5>
                    {step.time && (
                      <span className="text-[11px] text-slate-400">
                        {formatTime(step.time)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Delivery Partner & Kitchen Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        {/* Delivery Partner */}
        {deliveryBoy.name ? (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  {t.deliveryPartner}
                </span>
                <h5 className="font-black text-slate-900 dark:text-slate-100 truncate">
                  {deliveryBoy.name}
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === 'hi' ? 'डिलीवरी के लिए रास्ते में है' : 'On the way to deliver'}
                </p>
              </div>
            </div>

            {deliveryBoy.mobile && (
              <button
                type="button"
                onClick={() => makePhoneCall(deliveryBoy.mobile)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t.callPartner}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-slate-400 font-medium">
            <Bike className="w-5 h-5" />
            <span>{lang === 'hi' ? 'डिलीवरी पार्टनर नियुक्त हो रहा है...' : 'Delivery partner being assigned...'}</span>
          </div>
        )}

        {/* Kitchen Outlet */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-slate-800 text-[#F97316] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                {lang === 'hi' ? 'किचन / आउटलेट' : 'Kitchen'}
              </span>
              <h5 className="font-black text-slate-900 dark:text-slate-100 truncate">
                {restaurant.name || 'Dastak Kitchen'}
              </h5>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {restaurant.address || 'Civil Lines, Kanpur'}
              </p>
            </div>
          </div>

          {restaurant.phone && (
            <button
              type="button"
              onClick={() => makePhoneCall(restaurant.phone)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>{t.callKitchen || (lang === 'hi' ? 'किचन को कॉल करें' : 'Call Kitchen')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Delivery Address Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase tracking-wider text-[10px]">
          <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
          <span>{lang === 'hi' ? 'डिलीवरी का पता' : 'DELIVERY ADDRESS'}</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 space-y-1">
          <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
            {order.address?.customer_name || (lang === 'hi' ? 'डिलीवरी गंतव्य' : 'Delivery Destination')}
          </h5>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words font-medium">
            {order.address?.address || 'Civil Lines, Kanpur'}
          </p>
          {order.address?.landmark && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
              🚩 {lang === 'hi' ? 'लैंडमार्क:' : 'Landmark:'} {order.address.landmark}
            </span>
          )}
        </div>
      </div>

      {/* 6. Itemized Order Bill Receipt */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase tracking-wider text-[10px]">
          <Receipt className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'ऑर्डर विवरण व रसीद' : 'ORDER ITEMS & RECEIPT'}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between">
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {it.quantity}x {it.item_name || it.name}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(it.total_price || it.unit_price * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
          <div className="flex justify-between">
            <span>{t.itemTotal || (lang === 'hi' ? 'आइटम का मूल्य' : 'Subtotal')}</span>
            <span>{formatCurrency(bill.subtotal || order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.deliveryFee || (lang === 'hi' ? 'डिलीवरी शुल्क' : 'Delivery Fee')}</span>
            <span>{formatCurrency(bill.delivery_fee || order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.taxes || (lang === 'hi' ? 'टैक्स व शुल्क' : 'Taxes')}</span>
            <span>{formatCurrency(bill.tax_amount || order.tax_amount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span>{t.grandTotal} ({order.payment_mode === 'COD' ? (lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery') : (lang === 'hi' ? 'ऑनलाइन भुगतान' : 'Online Paid')})</span>
            <span className="text-base text-[#2845D6] dark:text-blue-400">
              {formatCurrency(bill.total_amount || order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={lang === 'hi' ? 'ऑर्डर कैंसिल करें?' : 'Cancel Order?'}
        subtitle={lang === 'hi' ? `ऑर्डर #${order.order_number}` : `Order #${order.order_number}`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {lang === 'hi'
              ? 'क्या आप वाकई इस ऑर्डर को कैंसिल करना चाहते हैं? कृपया कारण चुनें:'
              : 'Are you sure you want to cancel this order? Please tell us the reason:'}
          </p>

          <div className="space-y-2">
            {[
              { en: 'Placed by mistake', hi: 'गलती से ऑर्डर हो गया' },
              { en: 'Need to change delivery address', hi: 'डिलीवरी का पता बदलना है' },
              { en: 'Food preparation taking too long', hi: 'तैयारी में बहुत अधिक समय लग रहा है' },
              { en: 'Ordered wrong items', hi: 'गलत आइटम ऑर्डर हो गया' },
            ].map((reasonObj, i) => {
              const reasonText = lang === 'hi' ? reasonObj.hi : reasonObj.en
              return (
                <label
                  key={i}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReason === reasonObj.en || cancelReason === reasonObj.hi}
                    onChange={() => setCancelReason(reasonText)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {reasonText}
                  </span>
                </label>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
            >
              {lang === 'hi' ? 'नहीं, ऑर्डर रखें' : 'No, Keep Order'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={handleCancelOrder}
            >
              {lang === 'hi' ? 'हाँ, कैंसिल करें' : 'Yes, Cancel Order'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rating and Review Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        order={order}
        onReviewSuccess={() => {
          setReviewed(true)
          fetchOrder()
        }}
      />
    </div>
  )
}

export default OrderTrackingPage
