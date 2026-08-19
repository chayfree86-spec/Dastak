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
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full md:w-auto">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 text-xl sm:text-2xl font-black flex items-center justify-center shrink-0 shadow-2xs">
            {customer?.name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">{customer?.name}</h2>
              <StatusBadge status={customer?.status} size="xs" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              {customer?.mobile && (
                <a
                  href={`tel:${customer?.mobile}`}
                  className="font-mono text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1"
                >
                  <span>{formatPhone(customer?.mobile)}</span>
                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                </a>
              )}
              {customer?.email && (
                <>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="truncate">{customer?.email}</span>
                </>
              )}
              {customer?.joined_date && (
                <>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="text-[11px] text-slate-400">Joined: {formatDate(customer?.joined_date)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
          {customer?.mobile && (
            <a
              href={`tel:${customer?.mobile}`}
              className="flex-1 sm:flex-none h-11 sm:h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Phone className="w-4 h-4" />
              <span>Call Customer</span>
            </a>
          )}
          <Button
            variant={customer?.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="md"
            icon={customer?.status === 'ACTIVE' ? Ban : CheckCircle2}
            onClick={() => setBlockConfirmOpen(true)}
            className="flex-1 sm:flex-none h-11 sm:h-9 text-xs"
          >
            {customer?.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
          </Button>
        </div>
      </div>

      {/* 3 Metric Cards Bento Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Total Orders</span>
          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1">
            {customer?.total_orders || 0}
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Lifetime Spend</span>
          <div className="text-base sm:text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(customer?.total_spend)}
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-center sm:text-left">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Avg Order Value</span>
          <div className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate">
            {formatCurrency(customer?.average_order_value)}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'orders' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 sm:space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Customer Order History</h3>
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
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

          {/* Mobile Order Cards */}
          <div className="md:hidden space-y-2.5">
            {ordersLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Loading orders...
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No orders placed yet.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-[#2845D6] dark:text-blue-400">
                      <span>#{ord.id}</span>
                      <span className="text-[11px] font-normal text-slate-400">&bull; {formatDateTime(ord.time)}</span>
                    </div>
                    <StatusBadge status={ord.status} size="xs" />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ord.restaurant}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(ord.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={ord.payment} size="xs" />
                  </div>
                </div>
              ))
            )}
          </div>
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
