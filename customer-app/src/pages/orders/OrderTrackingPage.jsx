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
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime, formatTime, getOrderStatusText } from '../../utils/formatters'
import { makePhoneCall } from '../../utils/geo'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LiveOrderTrackingMap from '../../components/orders/LiveOrderTrackingMap'

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
  const [liveTelemetry, setLiveTelemetry] = useState({ distanceKm: 1.4, etaMins: 6 })

  const fetchOrder = useCallback(async () => {
    try {
      const res = await customerApi.getOrder(orderNumber)
      const data = res.data || {}
      setOrder(data)

      // Calculate 5-minute cancellation window from placed_at
      const placedTime = new Date(data.timelines?.placed_at || data.placed_at || data.created_at).getTime()
      const fiveMinsAfter = placedTime + 5 * 60 * 1000
      const diffSecs = Math.max(0, Math.floor((fiveMinsAfter - Date.now()) / 1000))
      setSecondsRemaining(diffSecs)
    } catch (e) {
      console.warn('Failed to load order:', e)
    } finally {
      setLoading(false)
    }
  }, [orderNumber])

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 8000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  // Countdown timer for cancellation
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
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
  const canCancel = !isCancelled && !isDelivered && (secondsRemaining > 0 || order.can_cancel)

  // Timeline Steps
  const steps = [
    {
      id: 'PLACED',
      label: 'Order Placed',
      desc: 'Order received and sent to restaurant',
      isDone: true,
      time: order.timelines?.placed_at,
    },
    {
      id: 'CONFIRMED',
      label: 'Restaurant Accepted',
      desc: 'Restaurant accepted your order',
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
      label: 'Kitchen Preparing Food',
      desc: 'Fresh ingredients being cooked',
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
      label: 'Picked Up & On the Way',
      desc: 'Delivery partner on the way to your location',
      isDone: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
      time: order.timelines?.dispatched_at,
    },
    {
      id: 'DELIVERED',
      label: 'Delivered',
      desc: 'Package delivered to your address',
      isDone: order.status === 'DELIVERED',
      time: order.timelines?.delivered_at,
    },
  ]

  const deliveryBoy = order.delivery_boy || {}
  const restaurant = order.restaurant || {}
  const items = order.items || []
  const bill = order.bill || {}

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Top Navigation */}
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2845D6] dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </button>

      {/* 2. Main Live Status Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#2845D6] text-white px-2.5 py-0.5 rounded-lg">
                ORDER #{order.order_number}
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
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50/80 dark:from-slate-900 dark:to-slate-800 border-2 border-blue-200 dark:border-blue-800/80 text-center shrink-0 min-w-[130px] shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {order.status === 'OUT_FOR_DELIVERY' ? 'LIVE ARRIVAL' : t.estimatedArrival}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono leading-tight">
                {order.status === 'OUT_FOR_DELIVERY'
                  ? liveTelemetry.etaMins <= 1
                    ? 'Arriving Now!'
                    : `~${liveTelemetry.etaMins} Mins`
                  : `~${order.estimated_delivery_minutes || 25} Mins`}
              </div>
              {order.status === 'OUT_FOR_DELIVERY' && (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {liveTelemetry.distanceKm} km away
                </span>
              )}
            </div>
          )}
        </div>

        {/* 5-Minute Cancellation Notice Banner */}
        {canCancel && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                {t.cancelAllowedNotice} ({Math.floor(secondsRemaining / 60)}:
                {String(secondsRemaining % 60).padStart(2, '0')} left)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="text-xs font-black text-rose-600 hover:underline shrink-0 cursor-pointer"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>

      {/* 3. Live Interactive Delivery Route Map (Live Rider with Bike Marker) */}
      {!isCancelled && (
        <LiveOrderTrackingMap order={order} onEtaChange={setLiveTelemetry} />
      )}

      {/* 4. Visual Step-by-Step Timeline */}
      {!isCancelled && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            DELIVERY PROGRESS
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
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatTime(step.time)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
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
                <p className="text-[11px] text-slate-500">On the way to deliver</p>
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
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-slate-400">
            <Bike className="w-5 h-5" />
            <span>Delivery partner being assigned...</span>
          </div>
        )}

        {/* Kitchen Outlet */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-slate-800 text-[#F97316] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                Kitchen
              </span>
              <h5 className="font-black text-slate-900 dark:text-slate-100 truncate">
                {restaurant.name || 'Dastak Kitchen'}
              </h5>
              <p className="text-[11px] text-slate-500 truncate">
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
              <span>{t.callKitchen}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Delivery Address Card (Multi-line full address without truncation) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase tracking-wider text-[10px]">
          <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
          <span>DELIVERY ADDRESS</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
          <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
            {order.address?.customer_name || 'Delivery Destination'}
          </h5>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed break-words">
            {order.address?.address || 'Civil Lines, Kanpur'}
          </p>
          {order.address?.landmark && (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
              🚩 Landmark: {order.address.landmark}
            </span>
          )}
        </div>
      </div>

      {/* 6. Itemized Order Bill Receipt */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase tracking-wider text-[10px]">
          <Receipt className="w-3.5 h-3.5" />
          <span>ORDER ITEMS & RECEIPT</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between">
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {it.quantity}x {it.item_name || it.name}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(it.total_price || it.unit_price * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(bill.subtotal || order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{formatCurrency(bill.delivery_fee || order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes</span>
            <span>{formatCurrency(bill.tax_amount || order.tax_amount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span>Total ({order.payment_mode === 'COD' ? 'Cash on Delivery' : 'Online Paid'})</span>
            <span className="font-mono text-base text-[#2845D6] dark:text-blue-400">
              {formatCurrency(bill.total_amount || order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order?"
        subtitle={`Order #${order.order_number}`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to cancel this order? Please tell us the reason:
          </p>

          <div className="space-y-2">
            {[
              'Placed by mistake',
              'Need to change delivery address',
              'Food preparation taking too long',
              'Ordered wrong items',
            ].map((reason, i) => (
              <label
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="cancelReason"
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {reason}
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
            >
              No, Keep Order
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={handleCancelOrder}
            >
              Yes, Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default OrderTrackingPage
