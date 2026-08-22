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
  Cake,
  Heart,
  Flame,
  Utensils,
  Award,
  ShieldCheck,
  Check,
  XCircle,
  Smartphone,
  RotateCcw,
  ShieldAlert,
  Laptop,
  KeyRound,
  Sparkles,
} from 'lucide-react'
import customersApi from '../../api/customers.api'
import apiClient from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime, formatDate } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LiveMapTracker from '../../components/common/LiveMapTracker'
import { useToast } from '../../context/ToastContext'

const DIETARY_OPTIONS_MASTER = [
  { id: 'ALL', label: 'All Foods', icon: '🍽️', desc: 'No restrictions' },
  { id: 'VEG', label: 'Pure Veg', icon: '🌱', desc: '100% vegetarian' },
  { id: 'NON_VEG', label: 'Non-Veg', icon: '🍗', desc: 'Chicken, meat, fish' },
  { id: 'EGG', label: 'Eggitarian', icon: '🥚', desc: 'Veg + Egg items' },
  { id: 'VEGAN', label: 'Vegan', icon: '🥑', desc: '100% plant-based' },
  { id: 'JAIN', label: 'Jain Friendly', icon: '🌿', desc: 'No onion/garlic/root veg' },
]

const TASTE_TAGS_MASTER = [
  { id: 'spicy', label: 'Spicy & Masala', icon: '🌶️' },
  { id: 'sweet', label: 'Sweet Tooth', icon: '🍯' },
  { id: 'tangy', label: 'Tangy & Chaat', icon: '🍋' },
  { id: 'cheesy', label: 'Cheesy & Creamy', icon: '🧀' },
  { id: 'crispy', label: 'Crispy & Crunchy', icon: '🥨' },
  { id: 'healthy', label: 'Healthy & Low Oil', icon: '🥗' },
  { id: 'desi', label: 'Desi North Indian', icon: '🍲' },
  { id: 'south_indian', label: 'South Indian', icon: '🥥' },
  { id: 'street_food', label: 'Street Food & Momos', icon: '🥟' },
  { id: 'chai_coffee', label: 'Chai & Coffee', icon: '☕' },
  { id: 'high_protein', label: 'High Protein', icon: '🥩' },
  { id: 'pizza_fastfood', label: 'Pizza & Fast Food', icon: '🍕' },
  { id: 'chinese', label: 'Chinese & Noodles', icon: '🍜' },
  { id: 'biryani', label: 'Biryani Lover', icon: '🍚' },
]

export const CustomerDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('orders')
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const { data: customer, loading, error, retry } = useApi(
    () => customersApi.getCustomerDetails(id),
    [id]
  )

  const { data: orders, loading: ordersLoading } = useApi(
    () => customersApi.getCustomerOrders(id, { limit: 10 }),
    [id]
  )

  const { data: deviceData, loading: deviceLoading, retry: retryDevice } = useApi(
    () => customersApi.getDeviceSession(id),
    [id]
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

  const handleRevokeDevice = async () => {
    setRevokeLoading(true)
    try {
      const res = await (customersApi?.revokeDevice
        ? customersApi.revokeDevice(id, { reason: 'ADMIN_MANUAL_REVOKE' })
        : apiClient.post(`/admin/customers/${id}/revoke-device`, { reason: 'ADMIN_MANUAL_REVOKE' }))
      
      toast.success('Device Revoked Successfully', res?.message || `${customer?.name || 'Customer'} can now log in on a new device.`)
      setRevokeConfirmOpen(false)
      if (typeof retryDevice === 'function') retryDevice()
      retry()
    } catch (err) {
      toast.error('Revoke Failed', err.message || 'Unable to revoke device session.')
    } finally {
      setRevokeLoading(false)
    }
  }

  const tabs = [
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'profile', label: 'Personal Details & Taste', icon: User },
    { id: 'device', label: 'Device & Session', icon: Smartphone },
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
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 text-xl sm:text-2xl font-black flex items-center justify-center shrink-0 shadow-2xs">
            {customer?.avatar ? (
              <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
            ) : (
              customer?.name?.charAt(0) || 'C'
            )}
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
                  className="font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1"
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

        {/* Action Buttons: Mobile PWA 2-Tier Stack, Desktop Inline Row */}
        <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row md:flex-row items-stretch md:items-center gap-2">
          {customer?.mobile && (
            <a
              href={`tel:${customer?.mobile}`}
              className="w-full sm:w-auto min-h-[42px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs shrink-0"
            >
              <Phone className="w-4 h-4" />
              <span>Call Customer</span>
            </a>
          )}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              icon={RotateCcw}
              onClick={() => setRevokeConfirmOpen(true)}
              className="w-full sm:w-auto min-h-[42px] text-xs justify-center whitespace-nowrap"
              title="Revoke active phone session so customer can log in on a new device"
            >
              Revoke Device
            </Button>
            <Button
              variant={customer?.status === 'ACTIVE' ? 'danger' : 'primary'}
              size="md"
              icon={customer?.status === 'ACTIVE' ? Ban : CheckCircle2}
              onClick={() => setBlockConfirmOpen(true)}
              className="w-full sm:w-auto min-h-[42px] text-xs justify-center whitespace-nowrap"
            >
              {customer?.status === 'ACTIVE' ? 'Block Account' : 'Unblock Account'}
            </Button>
          </div>
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
          <div className="text-base sm:text-2xl font-black text-[#113BD0] dark:text-blue-400 mt-0.5 sm:mt-1 truncate">
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
                { key: 'id', header: 'Order ID', render: (r) => <span className="font-bold text-[#113BD0]">#{r.id}</span> },
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
                    <div className="flex items-center gap-1.5 font-bold text-[#113BD0] dark:text-blue-400">
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

      {/* Tab: Profile & Taste Preferences */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Personal Information & Milestones */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Personal Information & Milestones
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Field completion status & verified customer records
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                    customer?.profile_completion_percentage === 100
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
                      : 'bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200'
                  }`}
                >
                  {customer?.profile_completion_percentage || 0}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#113BD0] dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${customer?.profile_completion_percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Bento Grid Fields (Theme Consistent) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Customer Name */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.name
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#113BD0]" /> Full Name
                    </span>
                    {customer?.name ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
                    {customer?.name || '—'}
                  </div>
                </div>

                {/* 2. Primary Mobile */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.mobile
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Primary Phone
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                    {customer?.mobile ? `+91 ${formatPhone(customer.mobile)}` : '—'}
                  </div>
                </div>

                {/* 3. Email Address */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.email
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#113BD0]" /> Email Address
                    </span>
                    {customer?.email ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-xs truncate">
                    {customer?.email || '—'}
                  </div>
                </div>

                {/* 4. Alternate Mobile */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.alternate_mobile
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#113BD0]" /> Alternate Phone
                    </span>
                    {customer?.alternate_mobile ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs">
                    {customer?.alternate_mobile ? `+91 ${formatPhone(customer.alternate_mobile)}` : '—'}
                  </div>
                </div>

                {/* 5. Gender */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.gender
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#113BD0]" /> Gender
                    </span>
                    {customer?.gender ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-xs capitalize">
                    {customer?.gender ? customer.gender.replace('_', ' ').toLowerCase() : '—'}
                  </div>
                </div>

                {/* 6. Date of Birth (DOB) */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    customer?.date_of_birth
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5 text-[#F97316]" /> Date of Birth (DOB)
                    </span>
                    {customer?.date_of_birth ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                    <span>{customer?.date_of_birth ? formatDate(customer.date_of_birth) : '—'}</span>
                    {customer?.date_of_birth && (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        {Math.floor((new Date() - new Date(customer.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} Yrs
                      </span>
                    )}
                  </div>
                </div>

                {/* 7. Anniversary Date */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all sm:col-span-2 ${
                    customer?.anniversary_date
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Anniversary Date
                    </span>
                    {customer?.anniversary_date ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Updated
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Not Provided
                      </span>
                    )}
                  </div>
                  <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                    {customer?.anniversary_date ? formatDate(customer.anniversary_date) : '—'}
                  </div>
                </div>
              </div>

              {/* Loyalty Reward Points */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F97316]" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Dastak Loyalty Rewards Balance</span>
                </div>
                <span className="font-black text-[#113BD0] dark:text-blue-400 font-mono text-sm">
                  {customer?.loyalty_points || 0} Pts
                </span>
              </div>
            </div>

            {/* 2. Dietary Lifestyle & Food Taste Preferences */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Dietary & Palate Preferences
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customer food lifestyle and dish taste tags
                  </p>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Dietary Lifestyle Preference
                  </span>
                  {customer?.dietary_preference ? (
                    <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Updated by customer
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Default (All Foods)</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DIETARY_OPTIONS_MASTER.map((diet) => {
                    const isSelected =
                      customer?.dietary_preference === diet.id ||
                      (customer?.dietary_preference === diet.label) ||
                      (!customer?.dietary_preference && diet.id === 'ALL')

                    return (
                      <div
                        key={diet.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/50 border-2 border-[#113BD0] dark:border-blue-500 shadow-xs'
                            : 'bg-slate-50/40 dark:bg-slate-900/20 border border-slate-200/70 dark:border-slate-700/60 opacity-45'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{diet.icon}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#113BD0] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs font-black ${
                            isSelected
                              ? 'text-[#113BD0] dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {diet.label}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{diet.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Food Taste & Flavor Tags */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Taste & Flavor Preferences ({customer?.taste_preferences?.length || 0} Selected)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {customer?.taste_preferences?.length || 0} of {TASTE_TAGS_MASTER.length} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {TASTE_TAGS_MASTER.map((tag) => {
                    const isSelected =
                      Array.isArray(customer?.taste_preferences) &&
                      (customer.taste_preferences.includes(tag.id) ||
                        customer.taste_preferences.includes(tag.label))

                    return (
                      <div
                        key={tag.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-[#113BD0] dark:text-blue-300 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-40'
                        }`}
                      >
                        <span className="text-sm">{tag.icon}</span>
                        <span>{tag.label}</span>
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
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
                  <MapPin className="w-3.5 h-3.5 text-[#113BD0]" />
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

      {/* Tab: Device & Session */}
      {activeTab === 'device' && (
        <div className="space-y-6">
          {/* Active Device Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  deviceData?.has_active_device
                    ? 'bg-blue-50 text-[#113BD0] dark:bg-blue-950/60 dark:text-blue-400 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {deviceData?.active_session?.device_platform === 'desktop' ? (
                    <Laptop className="w-6 h-6" />
                  ) : (
                    <Smartphone className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {deviceData?.has_active_device ? (deviceData?.active_session?.device_name || 'Active Mobile Device') : 'No Active Device Bound'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      deviceData?.has_active_device
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {deviceData?.has_active_device ? 'Active Binding' : 'Unbound / Available'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {deviceData?.has_active_device
                      ? `Bound to customer mobile +91 ${customer?.mobile}. 1-Mobile policy active.`
                      : 'Customer is currently not locked to any specific phone device.'}
                  </p>
                </div>
              </div>

              {deviceData?.has_active_device && (
                <Button
                  variant="danger"
                  size="md"
                  icon={RotateCcw}
                  onClick={() => setRevokeConfirmOpen(true)}
                  loading={revokeLoading}
                  className="w-full md:w-auto"
                >
                  Revoke Device Binding
                </Button>
              )}
            </div>

            {/* Session Attributes Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hardware Platform</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5 capitalize">
                  {deviceData?.active_session?.device_platform || 'Mobile Phone (Standard)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Dastak Customer App Client</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Active / Heartbeat</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 block">
                  {deviceData?.active_session?.last_seen_at ? formatDateTime(deviceData?.active_session?.last_seen_at) : 'Active Session'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Session ID: #{deviceData?.active_session?.id || '—'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bound Since</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 block">
                  {deviceData?.active_session?.created_at ? formatDate(deviceData?.active_session?.created_at) : '—'}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                  {deviceData?.has_active_device ? '✓ 256-bit SHA Token Bound' : 'Ready for New Sign-in'}
                </span>
              </div>
            </div>
          </div>

          {/* Device Security & Policy Info Box */}
          <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                Why use "Revoke Device"?
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                For security, Dastak allows only 1 active mobile phone per customer account. If a customer changed their phone, lost their old device, or formatted their phone and gets the error <em>"This mobile number is already active on another mobile phone"</em>, click <strong>Revoke Device Binding</strong> above. The customer can then verify OTP and log in on their new device immediately.
              </p>
            </div>
          </div>
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

      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeDevice}
        loading={revokeLoading}
        type="danger"
        title={`Revoke Device Binding for ${customer?.name}?`}
        message={`This will immediately revoke the active device session on ${deviceData?.active_session?.device_name || 'their phone'} for mobile +91 ${customer?.mobile}. The customer will be able to log in on their new device immediately.`}
        confirmText="Revoke Device"
      />
    </div>
  )
}

export default CustomerDetails
