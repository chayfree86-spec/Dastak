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
    <div className="space-y-6 w-full">
      {/* Screen Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <span>New Incoming Orders</span>
            </h2>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase border select-none ${
                count > 0
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              {count} {count === 1 ? 'Pending' : 'Pending'}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            Incoming orders appear here automatically with real-time audio chime alerts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => refresh().catch(() => {})}
          className="shrink-0"
        >
          Check Now
        </Button>
      </div>

      {/* Loading State */}
      {loading && newOrders.length === 0 && <LoadingSkeleton count={2} />}

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
