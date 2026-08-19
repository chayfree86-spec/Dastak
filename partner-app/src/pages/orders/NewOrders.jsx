import React, { useState } from 'react'
import { Flame, RefreshCw, Clock, CheckCircle2, Inbox } from 'lucide-react'
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

  // 3. Mark Food Ready for Pickup Handler
  const handleConfirmReady = async (order) => {
    setActionLoading(true)
    try {
      await ordersApi.markReady(order.order_number)
      toast.success(
        'Food is Ready!',
        `Order #${order.order_number} is marked ready. Rider is notified for pickup.`
      )
      await refresh()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to mark order ready.')
    } finally {
      setActionLoading(false)
    }
  }

  const pendingCount = newOrders.filter((o) => o.status === 'PENDING').length
  const preparingCount = newOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length

  return (
    <div className="space-y-6 w-full">
      {/* Screen Header Bar */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <span>Live Kitchen Orders</span>
          </h2>
          {pendingCount > 0 && (
            <span className="px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500 text-white border border-rose-500 shadow-sm shadow-rose-500/30 animate-pulse select-none">
              {pendingCount} New
            </span>
          )}
          {preparingCount > 0 && (
            <span className="px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-blue-500 text-white border border-blue-500 shadow-sm shadow-blue-500/30 select-none">
              {preparingCount} In Kitchen
            </span>
          )}
          {newOrders.length === 0 && (
            <span className="px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 select-none">
              0 Active
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium truncate">
          Orders remain in queue until marked ready for pickup.
        </p>
      </div>

      {/* Loading State */}
      {loading && newOrders.length === 0 && <LoadingSkeleton count={2} />}

      {/* Error State */}
      {error && newOrders.length === 0 && (
        <ErrorState
          title="Unable to load active kitchen orders"
          message={error}
          onRetry={() => refresh().catch(() => {})}
        />
      )}

      {/* Empty State when no active orders */}
      {!loading && !error && newOrders.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No Active Orders"
          description="Your kitchen queue is clear! Incoming customer orders will appear here automatically."
          actionText="Refresh Kitchen Queue"
          onAction={() => refresh().catch(() => {})}
          className="py-16 sm:py-20"
        />
      )}

      {/* Active Kitchen Order Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {newOrders.map((order) => (
          <OrderCard
            key={order.id || order.order_number}
            order={order}
            onAccept={() => setSelectedOrderForAccept(order)}
            onReject={() => setSelectedOrderForReject(order)}
            onMarkReady={() => handleConfirmReady(order)}
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
