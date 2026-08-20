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
  const [activeStatus, setActiveStatus] = useState('READY_FOR_PICKUP')
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

  const orders = Array.isArray(ordersData?.data)
    ? ordersData.data
    : Array.isArray(ordersData)
    ? ordersData
    : []

  const tabs = [
    { id: 'READY_FOR_PICKUP', label: 'Ready' },
    { id: 'PENDING', label: 'New' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'ALL', label: 'All Orders' },
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
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Mobile-First Search & Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Order History
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
              Manage and track all restaurant orders.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shrink-0 border border-slate-200/80 dark:border-slate-700 select-none">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {/* Search Bar with Clear Button */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#113BD0] focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Horizontal Status Filter Tabs (Touch scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar select-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-3.5 h-9 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                isActive
                  ? 'bg-[#113BD0] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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

      {/* Confirmation Modal for Mark Ready (Touch-friendly) */}
      <Modal
        isOpen={!!readyConfirmOrder}
        onClose={() => setReadyConfirmOrder(null)}
        title="Food Ready for Pickup?"
        subtitle={`Is Order #${readyConfirmOrder?.order_number} packed and ready on the counter?`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The assigned delivery rider will be alerted to arrive immediately for pickup.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReadyConfirmOrder(null)}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center active:scale-98 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReady}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer select-none disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />
              <span>Yes, Ready</span>
            </button>
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
