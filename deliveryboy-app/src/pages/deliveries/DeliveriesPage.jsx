import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Calendar,
  ChevronRight,
  Store,
  User,
  Clock,
  Banknote,
  Navigation,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react'
import deliveryApi from '../../api/delivery.api'
import { formatCurrency, formatDateTime, formatAddress } from '../../utils/formatters'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import ActiveDeliveryCard from '../../components/delivery/ActiveDeliveryCard'

export const DeliveriesPage = () => {
  const { activeOrder, refreshActiveOrder } = useAuth()

  const [tab, setTab] = useState('active') // 'active' | 'completed' | 'all'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await deliveryApi.getHistory({ page, per_page: 15 })
      const data = res.data?.data || []
      const meta = res.data?.meta || {}
      setOrders(data)
      setTotalPages(meta.last_page || 1)
    } catch (e) {
      console.warn('Failed to load trips history:', e)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (tab !== 'active') {
      fetchHistory()
    } else {
      refreshActiveOrder()
      setLoading(false)
    }
  }, [tab, fetchHistory, refreshActiveOrder])

  const filteredHistory = orders.filter((o) => {
    if (tab === 'completed') return o.status === 'DELIVERED'
    return true
  })

  return (
    <div className="space-y-4">
      {/* 1. Top Section Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Delivery Trips
          </h2>
          <p className="text-xs text-slate-400">
            Track active order and completed trip history
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              tab === 'active'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Active Trip {activeOrder && '(1)'}
          </button>
          <button
            type="button"
            onClick={() => setTab('completed')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              tab === 'completed'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              tab === 'all'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* 2. Active Trip Tab Content */}
      {tab === 'active' && (
        <div>
          {activeOrder ? (
            <ActiveDeliveryCard order={activeOrder} onRefresh={refreshActiveOrder} />
          ) : (
            <EmptyState
              icon={Package}
              title="No Active Trip Right Now"
              description="When a customer order is assigned to you by central dispatch, it will appear here in real time."
            />
          )}
        </div>
      )}

      {/* 3. Completed / All History Content */}
      {tab !== 'active' && (
        <div>
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Trips Found"
              description="No historical delivery trips recorded for this category."
            />
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const restaurant = item.restaurant || {}
                const customer = item.customer || item.delivery_address || {}
                const isCod = item.payment_mode === 'COD' || item.payment_mode === 'CASH_ON_DELIVERY'
                const totalAmount = item.bill?.total_amount || item.total_amount || 0

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedOrder(item)}
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#113BD0]/50 dark:hover:border-blue-500/50 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          #{item.order_number}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTime(item.placed_at || item.created_at)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                          {formatCurrency(totalAmount)}
                        </span>
                        <StatusBadge status={item.status} size="xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                        <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{restaurant.name || 'Restaurant'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                        <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="truncate">{customer.name || customer.customer_name || 'Customer'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous Page
                  </Button>
                  <span className="text-xs font-bold text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next Page
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Trip Details #${selectedOrder.order_number}`}
          subtitle={formatDateTime(selectedOrder.placed_at || selectedOrder.created_at)}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-500">Trip Status:</span>
              <StatusBadge status={selectedOrder.status} size="sm" />
            </div>

            {/* Restaurant Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                Restaurant
              </span>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {selectedOrder.restaurant?.name}
              </h5>
              <p className="text-slate-500">
                {selectedOrder.restaurant?.address_line1 || selectedOrder.restaurant?.address}
              </p>
            </div>

            {/* Customer Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
                Customer & Delivery Address
              </span>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {selectedOrder.customer?.name || selectedOrder.delivery_address?.customer_name || 'Customer'}
              </h5>
              <p className="text-slate-500">
                {formatAddress(selectedOrder.delivery_address || selectedOrder.delivery_address_json) || selectedOrder.delivery_address?.address || 'Kanpur, Uttar Pradesh'}
              </p>
            </div>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-500 block">Items Delivered:</span>
                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span>{item.quantity}x {item.item_name}</span>
                      <span className="font-bold">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 flex justify-between items-center">
              <span className="font-black text-slate-900 dark:text-slate-100">
                Total Bill Amount:
              </span>
              <span className="text-base font-black text-[#113BD0] dark:text-blue-400">
                {formatCurrency(selectedOrder.bill?.total_amount || selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default DeliveriesPage
