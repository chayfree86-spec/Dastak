import React, { useState } from 'react'
import { Flame, RefreshCw, Clock, CheckCircle2, Sparkles, Inbox } from 'lucide-react'
import { useOrderPolling } from '../../hooks/useOrderPolling'
import { useToast } from '../../context/ToastContext'
import ordersApi from '../../api/orders.api'
import OrderCard from '../../components/orders/OrderCard'
import PrepTimeModal from '../../components/orders/PrepTimeModal'
import RejectReasonModal from '../../components/orders/RejectReasonModal'
import OrderDetailModal from './OrderDetailModal'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'

export const NewOrders = () => {
  const { newOrders, count, loading, error, refresh } = useOrderPolling(8000)
  const toast = useToast()

  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState(null)
  const [selectedOrderForReject, setSelectedOrderForReject] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // 1. Accept Order Handler with Preparation Time
  const handleConfirmAccept = async (order, prepTimeMinutes) => {
    setActionLoading(true)
    try {
      await ordersApi.acceptOrder(order.order_number, { prep_time_minutes: prepTimeMinutes })
      toast.success(
        'Order Accepted!',
        `Order #${order.order_number} sent to kitchen with ${prepTimeMinutes}m prep time.`
      )
      setSelectedOrderForAccept(null)
      await refresh()
    } catch (err) {
      toast.error('Accept Failed', err.message || 'Unable to accept order. It might have been updated by another user.')
    } finally {
      setActionLoading(false)
    }
  }

  // 2. Reject Order Handler with Mandatory Reason
  const handleConfirmReject = async (order, reason) => {
    setActionLoading(true)
    try {
      await ordersApi.rejectOrder(order.order_number, { reason })
      toast.warning('Order Rejected', `Order #${order.order_number} has been rejected. Customer is notified.`)
      setSelectedOrderForReject(null)
      await refresh()
    } catch (err) {
      toast.error('Reject Failed', err.message || 'Unable to reject order.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Screen Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#F97316]" />
              <span>New Orders</span>
            </h2>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase border ${
                count > 0
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse shadow-md shadow-rose-500/25'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {count} {count === 1 ? 'Pending' : 'Pending'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Incoming orders appear here automatically with real-time chime alerts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => refresh().catch(() => {})}
        >
          Check Now
        </Button>
      </div>

      {/* Loading State */}
      {loading && newOrders.length === 0 && <LoadingSkeleton count={3} />}

      {/* Error State */}
      {error && newOrders.length === 0 && (
        <ErrorState
          title="Unable to load new orders"
          message={error}
          onRetry={() => refresh().catch(() => {})}
        />
      )}

      {/* Empty State when no new orders */}
      {!loading && !error && newOrders.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No Pending Orders"
          description="Your kitchen is all caught up! New orders placed by customers will chime and show up here instantly."
          actionText="Refresh Kitchen Queue"
          onAction={() => refresh().catch(() => {})}
          className="py-16 sm:py-20"
        />
      )}

      {/* Active New Order Cards Grid (Full-Width Responsive 2-column on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {newOrders.map((order) => (
          <OrderCard
            key={order.id || order.order_number}
            order={order}
            onAccept={() => setSelectedOrderForAccept(order)}
            onReject={() => setSelectedOrderForReject(order)}
            onViewDetails={() => setDetailOrder(order)}
          />
        ))}
      </div>

      {/* Preparation Time Selection Modal on Accept */}
      <PrepTimeModal
        isOpen={!!selectedOrderForAccept}
        onClose={() => setSelectedOrderForAccept(null)}
        order={selectedOrderForAccept}
        onConfirm={handleConfirmAccept}
        loading={actionLoading}
      />

      {/* Mandatory Rejection Reason Modal */}
      <RejectReasonModal
        isOpen={!!selectedOrderForReject}
        onClose={() => setSelectedOrderForReject(null)}
        order={selectedOrderForReject}
        onConfirm={handleConfirmReject}
        loading={actionLoading}
      />

      {/* Detailed Order View Modal */}
      <OrderDetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
        onAccepted={() => {
          setDetailOrder(null)
          refresh()
        }}
      />
    </div>
  )
}

export default NewOrders
