import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, ShoppingBag, Filter, RefreshCw, Eye, Calendar, CreditCard, Bike, Store, User } from 'lucide-react'
import ordersApi from '../../api/orders.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import OrderDetailsDrawer from './OrderDetailsDrawer'

export const OrderList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStatus = searchParams.get('status') || 'NEW'

  const [activeTab, setActiveTab] = useState(currentStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const statusParam = searchParams.get('status') || 'NEW'
    setActiveTab(statusParam)
  }, [searchParams])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ status: tabId })
    setCurrentPage(1)
  }

  const { data, loading, error, meta, retry, silentRefresh } = useApi(
    () =>
      ordersApi.getOrders({
        status: activeTab !== 'ALL' ? activeTab : undefined,
        search: searchQuery || undefined,
        payment_method: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [activeTab, searchQuery, paymentFilter, currentPage]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [silentRefresh])

  const orderTabs = [
    { id: 'NEW', label: 'New' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'READY', label: 'Food Ready' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'PICKED_UP', label: 'Picked Up' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'ALL', label: 'All Orders' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'REJECTED', label: 'Rejected' },
  ]

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (row) => (
        <span className="font-bold text-[#113BD0] dark:text-blue-400 hover:underline">
          #{row.id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.customer}</span>,
    },
    {
      key: 'restaurant',
      header: 'Restaurant',
      render: (row) => <span className="text-slate-700 dark:text-slate-300">{row.restaurant}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (row) => <StatusBadge status={row.payment} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'delivery_boy',
      header: 'Delivery Boy',
      render: (row) => (
        <span className={row.delivery_boy === 'Unassigned' ? 'text-amber-500 font-medium' : 'text-slate-700 dark:text-slate-300'}>
          {row.delivery_boy}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => <span className="text-slate-400 text-[11px]">{formatTime(row.time)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedOrderId(row.id)
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#113BD0] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Inspect Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Live Order Management
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time incoming orders & dispatch queue.
        </p>
      </div>

      {/* 10 Status Tabs */}
      <Tabs tabs={orderTabs} activeTab={activeTab} onChange={handleTabChange} />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID (e.g. D4829), customer or restaurant..."
            className="w-full h-11 sm:h-10 pl-9 pr-4 text-sm sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <CustomSelect
            value={paymentFilter}
            onChange={setPaymentFilter}
            className="w-full md:w-44"
            options={[
              { value: 'ALL', label: 'All Payment Modes' },
              { value: 'ONLINE_PAYMENT', label: 'Online Paid (UPI/Card)' },
              { value: 'COD', label: 'Cash on Delivery (COD)' },
            ]}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data || []}
          loading={loading}
          error={error}
          onRetry={retry}
          emptyTitle="No orders found"
          emptyDescription="There are no active orders matching your current filter criteria."
          pagination={
            meta
              ? {
                  currentPage: meta.current_page || currentPage,
                  totalPages: meta.last_page || 1,
                  totalItems: meta.total || (data ? data.length : 0),
                  itemsPerPage: meta.per_page || 10,
                  onPageChange: setCurrentPage,
                }
              : undefined
          }
          onRowClick={(row) => setSelectedOrderId(row.id)}
        />
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading orders...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No orders found matching this filter.
          </div>
        ) : (
          data.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#113BD0] dark:text-blue-400">
                  #{order.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={order.status} size="xs" />
                  <span className="text-[10px] text-slate-400 font-medium">{formatTime(order.time)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{order.customer || order.customer_name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{order.restaurant || order.restaurant_name}</p>
                </div>
                <span className="font-black text-slate-900 dark:text-slate-100 text-sm shrink-0">
                  {formatCurrency(order.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                <StatusBadge status={order.payment || order.payment_method} size="xs" />
                <span className={`text-[11px] font-medium ${order.delivery_boy === 'Unassigned' ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                  {order.delivery_boy || 'Unassigned'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Order Drawer */}
      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={retry}
        />
      )}
    </div>
  )
}

export default OrderList
