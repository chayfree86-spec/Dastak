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
  const initialStatus = searchParams.get('status') || 'ALL'

  const [activeTab, setActiveTab] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam && statusParam !== activeTab) {
      setActiveTab(statusParam)
    }
  }, [searchParams])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'ALL') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', tabId)
    }
    setSearchParams(searchParams)
    setCurrentPage(1)
  }

  const { data, loading, error, meta, retry } = useApi(
    () =>
      ordersApi.getOrders({
        status: activeTab !== 'ALL' ? activeTab : undefined,
        search: searchQuery || undefined,
        payment_method: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [activeTab, searchQuery, paymentFilter, currentPage],
    {
      initialData: [
        { id: 'D4829', customer: 'Aarav Sharma', restaurant: 'Biryani Central', amount: 640.00, payment: 'ONLINE_PAYMENT', status: 'NEW', delivery_boy: 'Unassigned', time: new Date().toISOString() },
        { id: 'D4828', customer: 'Pooja Verma', restaurant: 'Royal Spice Kitchen', amount: 480.00, payment: 'COD', status: 'PREPARING', delivery_boy: 'Vikas Kumar', time: new Date(Date.now() - 15 * 60000).toISOString() },
        { id: 'D4827', customer: 'Rohit Gupta', restaurant: 'Punjabi Tadka', amount: 920.00, payment: 'ONLINE_PAYMENT', status: 'OUT_FOR_DELIVERY', delivery_boy: 'Amit Singh', time: new Date(Date.now() - 30 * 60000).toISOString() },
        { id: 'D4826', customer: 'Neha Patel', restaurant: 'South Express', amount: 310.00, payment: 'COD', status: 'DELIVERED', delivery_boy: 'Rahul Pal', time: new Date(Date.now() - 60 * 60000).toISOString() },
        { id: 'D4825', customer: 'Manish Singh', restaurant: 'Burger & Beyond', amount: 550.00, payment: 'ONLINE_PAYMENT', status: 'READY', delivery_boy: 'Suresh Patil', time: new Date(Date.now() - 75 * 60000).toISOString() },
        { id: 'D4824', customer: 'Ananya Roy', restaurant: 'Biryani Central', amount: 720.00, payment: 'ONLINE_PAYMENT', status: 'CANCELLED', delivery_boy: 'Unassigned', time: new Date(Date.now() - 120 * 60000).toISOString() },
      ],
    }
  )

  const orderTabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'NEW', label: 'New', badge: 3 },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'PREPARING', label: 'Preparing', badge: 5 },
    { id: 'READY', label: 'Food Ready' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'PICKED_UP', label: 'Picked Up' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'REJECTED', label: 'Rejected' },
  ]

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (row) => (
        <span className="font-mono font-bold text-[#2845D6] dark:text-blue-400 hover:underline">
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Inspect Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Live Order Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor incoming orders, track delivery timelines, and manage exceptions.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
          Refresh Queue
        </Button>
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
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
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

      {/* Orders Data Table */}
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
