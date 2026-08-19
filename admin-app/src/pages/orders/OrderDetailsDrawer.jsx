import React, { useState } from 'react'
import {
  ShoppingBag,
  User,
  Store,
  Bike,
  CreditCard,
  Percent,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import ordersApi from '../../api/orders.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime } from '../../utils/formatters'
import Drawer from '../../components/common/Drawer'
import StatusBadge from '../../components/common/StatusBadge'
import Timeline from '../../components/common/Timeline'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

export const OrderDetailsDrawer = ({
  orderId,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const toast = useToast()
  const [selectedRider, setSelectedRider] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { data: order, loading, error, retry } = useApi(
    () => ordersApi.getOrderDetails(orderId),
    [orderId],
    {
      initialData: {
        id: orderId || 'D4829',
        created_at: new Date(Date.now() - 35 * 60000).toISOString(),
        status: 'PREPARING',
        payment_method: 'ONLINE_PAYMENT',
        payment_status: 'PAID',
        
        customer: {
          name: 'Aarav Sharma',
          mobile: '9876543210',
          address: 'Flat 402, Tower B, Green Valley Apartments, Sector 62',
          landmark: 'Opposite Central Park',
          city: 'Noida',
        },

        restaurant: {
          id: 1,
          name: 'Biryani Central',
          address: 'Plot 42, Sector 18, Commercial Belt',
          mobile: '9811223344',
          commission_rate: 15,
        },

        delivery: {
          delivery_boy_id: 'R104',
          delivery_boy_name: 'Vikas Kumar',
          mobile: '9899112233',
          assignment_type: 'AUTO',
          distance_km: 4.8,
          pickup_time: null,
          delivery_time: null,
        },

        items: [
          { id: 1, name: 'Hyderabadi Dum Biryani', variant: 'Full', addons: ['Extra Raita'], quantity: 2, price: 299.00, total: 598.00 },
          { id: 2, name: 'Chicken Tikka Kebab', variant: '6 Pcs', addons: ['Mint Chutney'], quantity: 1, price: 270.00, total: 270.00 },
        ],

        pricing: {
          subtotal: 868.00,
          discount: 100.00,
          delivery_charge: 45.00,
          tax: 43.40,
          final_amount: 856.40,
        },

        business_summary: {
          restaurant_commission: 130.20,
          delivery_boy_earning: 45.00,
          dastak_net_earning: 130.20,
          settlement_status: 'PENDING',
        },

        timeline: [
          { title: 'Order Placed', timestamp: new Date(Date.now() - 35 * 60000).toISOString(), status: 'completed', description: 'Paid via UPI' },
          { title: 'Restaurant Accepted', timestamp: new Date(Date.now() - 32 * 60000).toISOString(), status: 'completed', description: 'Estimated prep time 25 mins' },
          { title: 'Food Preparing', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), status: 'current', description: 'Kitchen is preparing your order' },
          { title: 'Food Ready for Pickup', timestamp: null, status: 'upcoming', description: 'Awaiting packing' },
          { title: 'Rider Assigned', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), status: 'upcoming', description: 'Vikas Kumar assigned' },
          { title: 'Order Picked Up', timestamp: null, status: 'upcoming', description: 'En route to customer' },
          { title: 'Delivered', timestamp: null, status: 'upcoming', description: 'Customer doorstep delivery' },
        ],
      },
    }
  )

  const handleUpdateStatus = async (nextStatus) => {
    setActionLoading(true)
    try {
      await ordersApi.updateOrderStatus(orderId, { status: nextStatus })
      toast.success('Order Status Updated', `Order #${orderId} moved to ${nextStatus}.`)
      retry()
      if (onStatusUpdated) onStatusUpdated()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to update order status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Reason Required', 'Please provide a cancellation reason.')
      return
    }
    setActionLoading(true)
    try {
      await ordersApi.cancelOrder(orderId, { reason: cancelReason })
      toast.success('Order Cancelled', `Order #${orderId} has been cancelled.`)
      setCancelModalOpen(false)
      retry()
      if (onStatusUpdated) onStatusUpdated()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to cancel order.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Order #${order?.id || orderId}`}
        subtitle={`Created on ${formatDateTime(order?.created_at)}`}
        width="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Status Header Cards */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <StatusBadge status={order?.status} size="md" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Payment:</span>
              <StatusBadge status={order?.payment_status} size="md" />
              <StatusBadge status={order?.payment_method} size="md" />
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2845D6]" />
              <span>Live Order Journey & Timestamps</span>
            </h4>
            <Timeline steps={order?.timeline || []} />
          </div>

          {/* Customer & Restaurant 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2845D6]" />
                <span>Customer</span>
              </h5>
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">{order?.customer?.name}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400">{formatPhone(order?.customer?.mobile)}</p>
                <p className="text-slate-500 dark:text-slate-400 leading-snug">{order?.customer?.address}</p>
                {order?.customer?.landmark && (
                  <p className="text-[11px] text-slate-400">Landmark: {order?.customer?.landmark}</p>
                )}
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#2845D6]" />
                <span>Restaurant</span>
              </h5>
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">{order?.restaurant?.name}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400">{formatPhone(order?.restaurant?.mobile)}</p>
                <p className="text-slate-500 dark:text-slate-400 leading-snug">{order?.restaurant?.address}</p>
                <p className="text-[11px] text-[#2845D6] dark:text-blue-400 font-semibold">
                  Commission: {order?.restaurant?.commission_rate}%
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Delivery Fleet Dispatch</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Rider:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {order?.delivery?.delivery_boy_name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Rider Mobile:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatPhone(order?.delivery?.mobile) || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trip Distance:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {order?.delivery?.distance_km} KM
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assignment:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {order?.delivery?.assignment_type}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items</h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {order?.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.quantity}x {item.name}
                    </span>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      {item.variant && <span>Variant: {item.variant}</span>}
                      {item.addons?.length > 0 && <span>&bull; {item.addons.join(', ')}</span>}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Business Summary Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Bill */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Customer Bill Summary</h5>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Item Subtotal</span>
                <span>{formatCurrency(order?.pricing?.subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(order?.pricing?.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order?.pricing?.delivery_charge)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Taxes & Charges</span>
                <span>{formatCurrency(order?.pricing?.tax)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-slate-100 text-sm">
                <span>Final Paid Amount</span>
                <span>{formatCurrency(order?.pricing?.final_amount)}</span>
              </div>
            </div>

            {/* Platform Business Earning Summary */}
            <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Dastak Business Revenue</h5>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Restaurant Commission</span>
                <span className="font-semibold">{formatCurrency(order?.business_summary?.restaurant_commission)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Rider Earning</span>
                <span>{formatCurrency(order?.business_summary?.delivery_boy_earning)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Settlement Status</span>
                <StatusBadge status={order?.business_summary?.settlement_status} size="xs" />
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between font-black text-[#2845D6] dark:text-blue-400 text-sm">
                <span>Dastak Net Earning</span>
                <span>{formatCurrency(order?.business_summary?.dastak_net_earning)}</span>
              </div>
            </div>
          </div>

          {/* Operational Admin Actions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Operational Actions</h5>
            <div className="flex flex-wrap items-center gap-2">
              {order?.status === 'NEW' && (
                <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('ACCEPTED')} loading={actionLoading}>
                  Accept Order
                </Button>
              )}
              {order?.status === 'ACCEPTED' && (
                <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('PREPARING')} loading={actionLoading}>
                  Move to Preparing
                </Button>
              )}
              {order?.status === 'PREPARING' && (
                <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('READY')} loading={actionLoading}>
                  Mark Food Ready
                </Button>
              )}
              {order?.status === 'READY' && (
                <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')} loading={actionLoading}>
                  Dispatch for Delivery
                </Button>
              )}
              {order?.status === 'OUT_FOR_DELIVERY' && (
                <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('DELIVERED')} loading={actionLoading}>
                  Mark as Delivered
                </Button>
              )}

              {order?.status !== 'DELIVERED' && order?.status !== 'CANCELLED' && (
                <Button variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        type="danger"
        title="Cancel Order?"
        message={`Are you sure you want to cancel Order #${orderId}? This will alert both the customer and partner restaurant.`}
        confirmText="Confirm Cancellation"
        loading={actionLoading}
      />
    </>
  )
}

export default OrderDetailsDrawer
