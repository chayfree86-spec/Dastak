import React, { useState } from 'react'
import {
  Clock,
  Search,
  Filter,
  CheckCircle,
  Inbox,
  RefreshCw,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import ordersApi from '../../api/orders.api'
import OrderCard from '../../components/orders/OrderCard'
import OrderDetailModal from './OrderDetailModal'
import PrepTimeModal from '../../components/orders/PrepTimeModal'
import RejectReasonModal from '../../components/orders/RejectReasonModal'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const OrdersList = () => {
  const toast = useToast()
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)
  const [readyConfirmOrder, setReadyConfirmOrder] = useState(null)
  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState(null)
  const [selectedOrderForReject, setSelectedOrderForReject] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data: ordersData, loading, error, retry } = useApi(
    () =>
      ordersApi.getOrders({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        search: searchQuery.trim() || undefined,
        per_page: 30,
      }),
    [activeStatus, searchQuery]
  )

  const orders = ordersData || []

  const tabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'New' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'READY_FOR_PICKUP', label: 'Ready' },
    { id: 'DISPATCHED', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ]

  // Mark Ready Confirmation
  const handleConfirmReady = async () => {
    if (!readyConfirmOrder) return
    setActionLoading(true)
    try {
      await ordersApi.markReady(readyConfirmOrder.order_number)
      toast.success(
        'Order Ready!',
        `Order #${readyConfirmOrder.order_number} marked ready. Rider can now pick up.`
      )
      setReadyConfirmOrder(null)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to mark order ready.')
    } finally {
      setActionLoading(false)
    }
  }

  // Accept Handler
  const handleConfirmAccept = async (order, prepTime) => {
    setActionLoading(true)
    try {
      await ordersApi.acceptOrder(order.order_number, { prep_time_minutes: prepTime })
      toast.success('Order Accepted', `Kitchen prep time set to ${prepTime}m.`)
      setSelectedOrderForAccept(null)
      retry()
    } catch (err) {
      toast.error('Accept Failed', err.message || 'Unable to accept order.')
    } finally {
      setActionLoading(false)
    }
  }

  // Reject Handler
  const handleConfirmReject = async (order, reason) => {
    setActionLoading(true)
    try {
      await ordersApi.rejectOrder(order.order_number, { reason })
      toast.warning('Order Rejected', `Order #${order.order_number} rejected.`)
      setSelectedOrderForReject(null)
      retry()
    } catch (err) {
      toast.error('Reject Failed', err.message || 'Unable to reject order.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2845D6] focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => retry()}>
          Refresh
        </Button>
      </div>

      {/* Horizontal Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2845D6] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content states */}
      {loading && <LoadingSkeleton count={3} />}

      {error && (
        <ErrorState
          title="Error loading orders"
          message={error}
          onRetry={() => retry()}
        />
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No Orders Found"
          description={
            searchQuery
              ? 'No matching orders found for your search query.'
              : `No orders currently in "${tabs.find((t) => t.id === activeStatus)?.label}" status.`
          }
          actionText={searchQuery ? 'Clear Search' : undefined}
          onAction={() => setSearchQuery('')}
          className="py-14"
        />
      )}

      {/* Orders Grid (Full-Width Responsive 2-column on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {orders.map((order) => (
          <OrderCard
            key={order.id || order.order_number}
            order={order}
            onAccept={() => setSelectedOrderForAccept(order)}
            onReject={() => setSelectedOrderForReject(order)}
            onMarkReady={() => setReadyConfirmOrder(order)}
            onViewDetails={() => setDetailOrder(order)}
          />
        ))}
      </div>

      {/* Confirmation Modal for Mark Ready */}
      <Modal
        isOpen={!!readyConfirmOrder}
        onClose={() => setReadyConfirmOrder(null)}
        title="Food Ready for Pickup?"
        subtitle={`Is Order #${readyConfirmOrder?.order_number} packed and ready on the counter?`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The assigned delivery rider will be alerted to arrive immediately for pickup.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="md" onClick={() => setReadyConfirmOrder(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="md"
              loading={actionLoading}
              onClick={handleConfirmReady}
              className="flex-1 shadow-md shadow-emerald-500/20"
            >
              Yes, Mark Ready
            </Button>
          </div>
        </div>
      </Modal>

      {/* Prep Time Modal */}
      <PrepTimeModal
        isOpen={!!selectedOrderForAccept}
        onClose={() => setSelectedOrderForAccept(null)}
        order={selectedOrderForAccept}
        onConfirm={handleConfirmAccept}
        loading={actionLoading}
      />

      {/* Reject Modal */}
      <RejectReasonModal
        isOpen={!!selectedOrderForReject}
        onClose={() => setSelectedOrderForReject(null)}
        order={selectedOrderForReject}
        onConfirm={handleConfirmReject}
        loading={actionLoading}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
      />
    </div>
  )
}

export default OrdersList
