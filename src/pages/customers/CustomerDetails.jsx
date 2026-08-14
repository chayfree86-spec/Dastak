import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Wallet,
  AlertCircle,
  Ban,
  CheckCircle2,
} from 'lucide-react'
import customersApi from '../../api/customers.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime, formatDate } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LiveMapTracker from '../../components/common/LiveMapTracker'
import { useToast } from '../../context/ToastContext'

export const CustomerDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('orders')
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { data: customer, loading, error, retry } = useApi(
    () => customersApi.getCustomerDetails(id),
    [id],
    {
      initialData: {
        id: id || 'C101',
        name: 'Aarav Sharma',
        mobile: '9876543210',
        email: 'aarav.sharma@gmail.com',
        joined_date: '2025-11-10T10:00:00Z',
        status: 'ACTIVE',
        total_orders: 28,
        total_spend: 14650.00,
        average_order_value: 523.21,
        latitude: 26.4500000,
        longitude: 80.3320000,
        zone_name: 'Kanpur Central Zone',
        addresses: [
          { id: 1, type: 'Home', address: 'Flat 402, Tower B, Ganga Heights, Civil Lines, Kanpur', is_default: true, latitude: 26.4500000, longitude: 80.3320000 },
          { id: 2, type: 'Office', address: 'Plot 10, Mall Road Commercial Complex, Kanpur', is_default: false, latitude: 26.4610000, longitude: 80.3450000 },
        ],
      },
    }
  )

  const { data: orders, loading: ordersLoading } = useApi(
    () => customersApi.getCustomerOrders(id, { limit: 10 }),
    [id],
    {
      initialData: [
        { id: 'D4829', restaurant: 'Biryani Central', amount: 640.00, payment: 'ONLINE_PAYMENT', status: 'NEW', time: new Date().toISOString() },
        { id: 'D4750', restaurant: 'Burger & Beyond', amount: 550.00, payment: 'ONLINE_PAYMENT', status: 'DELIVERED', time: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: 'D4680', restaurant: 'South Express', amount: 310.00, payment: 'COD', status: 'DELIVERED', time: new Date(Date.now() - 7 * 86400000).toISOString() },
      ],
    }
  )

  const handleToggleBlock = async () => {
    setActionLoading(true)
    const newStatus = customer?.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      await customersApi.toggleBlock(id, { status: newStatus })
      toast.success('Customer Status Updated', `${customer?.name} is now ${newStatus}.`)
      setBlockConfirmOpen(false)
      retry()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to update customer status.')
    } finally {
      setActionLoading(false)
    }
  }

  const tabs = [
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'location', label: 'Live Location', icon: MapPin },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Customer Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 text-2xl font-black flex items-center justify-center shadow-xs">
            {customer?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{customer?.name}</h2>
              <StatusBadge status={customer?.status} size="xs" />
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-mono">{formatPhone(customer?.mobile)}</span>
              <span>&bull;</span>
              <span>{customer?.email}</span>
              <span>&bull;</span>
              <span>Joined: {formatDate(customer?.joined_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Button
            variant={customer?.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            icon={customer?.status === 'ACTIVE' ? Ban : CheckCircle2}
            onClick={() => setBlockConfirmOpen(true)}
          >
            {customer?.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
          </Button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {customer?.total_orders || 0}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Spend</span>
          <div className="text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-1">
            {formatCurrency(customer?.total_spend)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Order Value</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(customer?.average_order_value)}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'orders' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Customer Order History</h3>
          <DataTable
            columns={[
              { key: 'id', header: 'Order ID', render: (r) => <span className="font-mono font-bold text-[#2845D6]">#{r.id}</span> },
              { key: 'restaurant', header: 'Restaurant' },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
              { key: 'payment', header: 'Payment', render: (r) => <StatusBadge status={r.payment} size="xs" /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
              { key: 'time', header: 'Ordered On', render: (r) => <span className="text-slate-400">{formatDateTime(r.time)}</span> },
            ]}
            data={orders || []}
            loading={ordersLoading}
            emptyTitle="No orders placed yet"
          />
        </div>
      )}

      {/* Tab: Live Location */}
      {activeTab === 'location' && (
        <LiveMapTracker
          title="Customer Delivery Geofence & Location"
          type="customer"
          entityName={customer?.name || 'Customer'}
          coordinates={{
            lat: customer?.latitude || 26.4500,
            lng: customer?.longitude || 80.3320,
          }}
          isOnline={customer?.status === 'ACTIVE'}
          address={customer?.addresses?.find((a) => a.is_default)?.address || customer?.addresses?.[0]?.address || 'Kanpur, Uttar Pradesh'}
          zoneName={customer?.zone_name || 'Kanpur Central Zone'}
        />
      )}

      {/* Tab: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customer?.addresses?.map((addr) => (
            <div key={addr.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2845D6]" />
                  {addr.type}
                </span>
                {addr.is_default && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    Default
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{addr.address}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
        onConfirm={handleToggleBlock}
        loading={actionLoading}
        type={customer?.status === 'ACTIVE' ? 'danger' : 'success'}
        title={customer?.status === 'ACTIVE' ? 'Block Customer?' : 'Unblock Customer?'}
        message={
          customer?.status === 'ACTIVE'
            ? `Are you sure you want to block ${customer?.name}? They will be logged out and unable to place orders.`
            : `Are you sure you want to unblock ${customer?.name}?`
        }
        confirmText={customer?.status === 'ACTIVE' ? 'Yes, Block' : 'Yes, Unblock'}
      />
    </div>
  )
}

export default CustomerDetails
