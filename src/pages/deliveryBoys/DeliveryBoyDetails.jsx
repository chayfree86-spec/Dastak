import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bike,
  Star,
  Phone,
  MapPin,
  Wallet,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Ban,
  Edit,
  Trash2,
  Download,
  Key,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import deliveryBoysApi from '../../api/deliveryBoys.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
import Input from '../../components/common/Input'
import Switch from '../../components/common/Switch'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LiveMapTracker from '../../components/common/LiveMapTracker'
import { useToast } from '../../context/ToastContext'
import DeliveryBoyFormModal from './DeliveryBoyFormModal'

export const DeliveryBoyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  // Login Credentials & Security State
  const [credEmail, setCredEmail] = useState('')
  const [credMobile, setCredMobile] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [credPin, setCredPin] = useState('')
  const [credLoginActive, setCredLoginActive] = useState(true)
  const [saveCredLoading, setSaveCredLoading] = useState(false)

  const { data: rider, loading, error, retry } = useApi(
    () => deliveryBoysApi.getDeliveryBoyDetails(id),
    [id],
    {
      initialData: {
        id: id || 'R101',
        name: 'Rahul Pal',
        mobile: '9876543211',
        emergency_contact: '9812345678',
        email: 'rahul.pal@dastakfleet.in',
        address: 'House No 12, Gali 4, Shanti Nagar, Kanpur',
        vehicle_type: 'Motorcycle (Hero Splendor)',
        vehicle_number: 'UP 78 AB 1234',
        license_number: 'DL-1420180012345',
        latitude: 26.4520000,
        longitude: 80.3340000,
        speed: 34.2,
        heading: 140,
        status: 'ACTIVE',
        is_online: true,
        rating: 4.8,
        total_deliveries: 428,
        completed_deliveries: 422,
        failed_deliveries: 6,
        lifetime_earnings: 28450.00,
        today_earnings: 520.00,
        cod_collected_pending: 1850.00,
        current_active_order: {
          id: 'D4827',
          restaurant: 'Punjabi Tadka',
          customer: 'Rohit Gupta',
          address: 'Flat 301, Tower C, Lotus Boulevard, Sector 100',
          amount: 920.00,
          payment: 'ONLINE_PAYMENT',
          assigned_at: new Date(Date.now() - 25 * 60000).toISOString(),
        },
      },
    }
  )

  const { data: orderHistory, loading: historyLoading } = useApi(
    () => deliveryBoysApi.getOrderHistory(id, { limit: 5 }),
    [id],
    {
      initialData: [
        { id: 'D4820', restaurant: 'Biryani Central', customer: 'Vipin Jain', amount: 640.00, status: 'DELIVERED', trip_earning: 45.00, time: new Date(Date.now() - 3600000).toISOString() },
        { id: 'D4811', restaurant: 'South Express', customer: 'Kiran Rao', amount: 320.00, status: 'DELIVERED', trip_earning: 40.00, time: new Date(Date.now() - 7200000).toISOString() },
        { id: 'D4802', restaurant: 'Royal Spice Kitchen', customer: 'Gaurav Das', amount: 890.00, status: 'DELIVERED', trip_earning: 55.00, time: new Date(Date.now() - 14400000).toISOString() },
      ],
    }
  )

  const handleReconcileCod = async () => {
    setActionLoading(true)
    try {
      await deliveryBoysApi.reconcileCod(id, { amount: rider?.cod_collected_pending })
      toast.success('COD Reconciled', `Successfully settled cash collection for ${rider?.name}.`)
      setReconcileModalOpen(false)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to reconcile COD.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRider = async () => {
    setActionLoading(true)
    try {
      await deliveryBoysApi.deleteDeliveryBoy(id)
      toast.success('Rider Deleted', 'Rider deleted successfully from the platform.')
      setDeleteConfirmOpen(false)
      navigate('/delivery-boys')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to delete rider.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadIdCard = async () => {
    setDownloadLoading(true)
    try {
      const response = await deliveryBoysApi.downloadIdCard(id)
      const blob = new Blob([response.data], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `id_card_${rider?.name || id}.html`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('ID Card Downloaded', 'Open the downloaded file to print.')
    } catch (err) {
      toast.error('Download Failed', 'Unable to generate ID Card.')
    } finally {
      setDownloadLoading(false)
    }
  }

  useEffect(() => {
    if (rider) {
      setCredEmail(rider.email || '')
      setCredMobile(rider.mobile || '')
      setCredLoginActive(rider.status === 'ACTIVE')
      setCredPassword('')
      setCredPin('')
    }
  }, [rider])

  const handleSaveCredentials = async (e) => {
    e?.preventDefault()
    if (!credEmail.trim()) {
      toast.warning('Email Required', 'Please enter a valid login email address.')
      return
    }
    if (!credMobile.trim()) {
      toast.warning('Mobile Required', 'Please enter a valid login mobile number.')
      return
    }
    if (credPin.trim() && !/^\d{4,6}$/.test(credPin.trim())) {
      toast.warning('Invalid PIN', 'Mobile login PIN must be between 4 and 6 numeric digits.')
      return
    }
    if (credPassword.trim() && credPassword.trim().length < 6) {
      toast.warning('Password Too Short', 'Password must be at least 6 characters.')
      return
    }
    setSaveCredLoading(true)
    try {
      const payload = {
        email: credEmail.trim(),
        mobile: credMobile.trim(),
        status: credLoginActive ? 'ACTIVE' : 'SUSPENDED',
      }
      if (credPassword.trim()) {
        payload.password = credPassword.trim()
      }
      if (credPin.trim()) {
        payload.login_pin = credPin.trim()
      }
      await deliveryBoysApi.updateDeliveryBoy(id, payload)
      toast.success('Credentials Updated', 'Delivery partner login credentials updated successfully.')
      setCredPassword('')
      setCredPin('')
      retry()
    } catch (err) {
      toast.error('Update Failed', err.message || 'Unable to update login credentials.')
    } finally {
      setSaveCredLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Bike },
    { id: 'location', label: 'Live Location', icon: MapPin },
    { id: 'active', label: 'Active Delivery', icon: Clock },
    { id: 'history', label: 'Order History', icon: ShoppingBag },
    { id: 'cod', label: 'COD Reconciliation', icon: Wallet },
    { id: 'profile', label: 'KYC & Vehicle', icon: FileText },
    { id: 'settings', label: 'Login & Security', icon: Key },
  ]

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/delivery-boys')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Delivery Boys</span>
        </button>
      </div>

      {/* Rider Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 w-full md:w-auto">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 text-[#F97316] dark:bg-orange-950/60 text-xl sm:text-2xl font-black flex items-center justify-center shrink-0 shadow-2xs">
            <Bike className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">{rider?.name}</h2>
              <StatusBadge status={rider?.status} size="xs" />
              <StatusBadge status={rider?.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              {rider?.mobile && (
                <a
                  href={`tel:${rider?.mobile}`}
                  className="font-mono text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1"
                >
                  <span>{formatPhone(rider?.mobile)}</span>
                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                </a>
              )}
              <span>&bull;</span>
              <span className="font-mono font-semibold">ID: {rider?.id}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {rider?.rating || '4.8'}
              </span>
              {rider?.vehicle_type && (
                <>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="hidden sm:inline">Vehicle: <strong>{rider?.vehicle_type}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
          {rider?.mobile && (
            <a
              href={`tel:${rider?.mobile}`}
              className="h-10 sm:h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </a>
          )}

          {rider?.cod_collected_pending > 0 && (
            <Button
              variant="accent"
              size="md"
              icon={Wallet}
              onClick={() => setReconcileModalOpen(true)}
              className="h-10 sm:h-9 text-xs"
            >
              Reconcile COD ({formatCurrency(rider?.cod_collected_pending)})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="md"
            icon={FileText}
            onClick={() => navigate(`/delivery-boys/${id}/id-card`)}
            className="h-10 sm:h-9 text-xs"
          >
            ID Card
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={Key}
            onClick={() => setActiveTab('settings')}
            className="h-10 sm:h-9 text-xs"
          >
            Login Access
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={Edit}
            onClick={() => setFormModalOpen(true)}
            className="h-10 sm:h-9 text-xs"
          >
            Edit
          </Button>

          <Button
            variant="danger"
            size="md"
            icon={Trash2}
            onClick={() => setDeleteConfirmOpen(true)}
            className="h-10 sm:h-9 text-xs"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Overview (2x2 Bento Grid on Mobile) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Total Deliveries</span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1">
              {rider?.total_deliveries || 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold block truncate">
              {rider?.completed_deliveries} Done &bull; {rider?.failed_deliveries} Cancel
            </span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Today's Earnings</span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1 truncate">
              {formatCurrency(rider?.today_earnings)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Per completed trip</span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Lifetime Earnings</span>
            <div className="text-lg sm:text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-0.5 sm:mt-1 truncate">
              {formatCurrency(rider?.lifetime_earnings)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">All-time payouts</span>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">Pending COD Due</span>
            <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 truncate">
              {formatCurrency(rider?.cod_collected_pending)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-500 font-semibold block truncate">Cash to deposit</span>
          </div>
        </div>
      )}

      {/* Tab: Live Location */}
      {activeTab === 'location' && (
        <LiveMapTracker
          title="Rider Real-Time GPS Tracking"
          type="rider"
          entityName={rider?.name || 'Delivery Partner'}
          coordinates={{
            lat: rider?.latitude || 26.4520,
            lng: rider?.longitude || 80.3340,
          }}
          speed={rider?.speed || 34.2}
          heading={rider?.heading || 140}
          isOnline={rider?.is_online}
          activeOrder={rider?.current_active_order}
          address={rider?.address}
          zoneName="Kanpur Central Zone"
        />
      )}

      {/* Tab: Active Delivery */}
      {activeTab === 'active' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F97316]" />
            <span>Currently Assigned Order</span>
          </h3>

          {rider?.current_active_order ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block">Order ID:</span>
                  <span className="font-mono font-bold text-base text-[#2845D6] dark:text-blue-400">
                    {rider.current_active_order.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pickup Restaurant:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rider.current_active_order.restaurant}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Customer:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {rider.current_active_order.customer}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block">Delivery Address:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {rider.current_active_order.address}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Bill Amount:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    {formatCurrency(rider.current_active_order.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned At:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatDateTime(rider.current_active_order.assigned_at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Rider is currently idle and available for new dispatch assignments.
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 sm:space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Trip History</h3>
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={[
                { key: 'id', header: 'Order ID', render: (r) => <span className="font-mono font-bold text-[#2845D6]">#{r.id}</span> },
                { key: 'restaurant', header: 'Restaurant' },
                { key: 'customer', header: 'Customer' },
                { key: 'amount', header: 'Order Value', align: 'right', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
                { key: 'trip_earning', header: 'Rider Pay', align: 'right', render: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.trip_earning)}</span> },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
                { key: 'time', header: 'Delivered At', render: (r) => <span className="text-slate-400">{formatDateTime(r.time)}</span> },
              ]}
              data={orderHistory || []}
              loading={historyLoading}
              emptyTitle="No trips logged"
            />
          </div>

          {/* Mobile Trip Cards */}
          <div className="md:hidden space-y-2.5">
            {historyLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Loading trip history...
              </div>
            ) : !orderHistory || orderHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No trips logged yet.
              </div>
            ) : (
              orderHistory.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-[#2845D6] dark:text-blue-400">
                      <span>#{trip.id}</span>
                      <span className="text-[11px] font-normal text-slate-400">&bull; {formatDateTime(trip.time)}</span>
                    </div>
                    <StatusBadge status={trip.status} size="xs" />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{trip.restaurant}</span>
                      <span className="text-[11px] text-slate-400">Customer: {trip.customer}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                        +{formatCurrency(trip.trip_earning)}
                      </span>
                      <span className="text-[10px] text-slate-400">Order: {formatCurrency(trip.amount)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: COD Ledger */}
      {activeTab === 'cod' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                <span>Cash on Delivery (COD) Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify cash collected from customer orders and settle dues.
              </p>
            </div>
            {rider?.cod_collected_pending > 0 && (
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setReconcileModalOpen(true)}
              >
                Reconcile & Settle {formatCurrency(rider?.cod_collected_pending)}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">Total Cash Collected (Pending Deposit)</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(rider?.cod_collected_pending || 0)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">Lifetime Delivered Value</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(rider?.lifetime_earnings * 10 || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: KYC & Vehicle Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KYC Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <FileText className="w-4 h-4 text-[#2845D6]" />
              <span>Government Identity Proofs</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Aadhaar Card Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.aadhar_number ? rider.aadhar_number.replace(/(\d{4})/g, '$1 ').trim() : 'Not Provided'}
                </span>
                {rider?.aadhar_url && (
                  <a
                    href={rider.aadhar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2845D6] hover:underline text-[10px] font-bold block mt-1"
                  >
                    View Hardcopy ➜
                  </a>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">PAN Card Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.pan_number || 'Not Provided'}
                </span>
                {rider?.pan_url && (
                  <a
                    href={rider.pan_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2845D6] hover:underline text-[10px] font-bold block mt-1"
                  >
                    View Hardcopy ➜
                  </a>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Driving License Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.license_number || 'Not Provided'}
                </span>
                {rider?.license_url && (
                  <a
                    href={rider.license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2845D6] hover:underline text-[10px] font-bold block mt-1"
                  >
                    View Hardcopy ➜
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Payout Bank Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Account Holder Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {rider?.bank_account_name || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Bank Account Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.bank_account_number || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Bank IFSC Code</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.bank_ifsc || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">UPI ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.bank_upi_id || 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <Bike className="w-4 h-4 text-[#F97316]" />
              <span>Vehicle Credentials</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Vehicle Category</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">
                  {rider?.vehicle_type?.replace('_', ' ').toLowerCase() || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Vehicle Number Plate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {rider?.vehicle_number || 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* App Login Credentials Summary Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#2845D6]" />
                <span>App Login Credentials</span>
              </h3>
              <Button
                variant="outline"
                size="xs"
                icon={Edit}
                onClick={() => setActiveTab('settings')}
              >
                Manage Credentials
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Registered Email</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {rider?.email || 'Not Provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Registered Mobile</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {formatPhone(rider?.mobile)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">App Access Status</span>
                <span className="inline-block mt-0.5">
                  <StatusBadge status={rider?.status} size="xs" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Login & Security */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Login Credentials Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#2845D6]" />
                <span>Delivery Partner App Login Credentials</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Delivery boys can log in using either their registered Email & Password, or Mobile Number & Security PIN.
              </p>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60">
                <Switch
                  checked={credLoginActive}
                  onChange={setCredLoginActive}
                  label="Allow Delivery Partner App Access (Active)"
                  description="When turned off, the delivery boy is suspended from logging in or receiving new orders."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2845D6]" />
                    <span>Email Login Method</span>
                  </div>
                  <Input
                    label="Login Email"
                    type="email"
                    required
                    placeholder="e.g. rider@dastakfleet.in"
                    value={credEmail}
                    onChange={(e) => setCredEmail(e.target.value)}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="•••••••• (leave blank to keep current)"
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 block">Min 6 characters. Leave blank if unchanged.</span>
                </div>

                <div className="space-y-3 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile Login Method</span>
                  </div>
                  <Input
                    label="Login Mobile Number"
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={credMobile}
                    onChange={(e) => setCredMobile(e.target.value)}
                  />
                  <Input
                    label="Mobile Security PIN"
                    type="password"
                    placeholder="e.g. 1234 (leave blank to keep current)"
                    value={credPin}
                    onChange={(e) => setCredPin(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 block">4 to 6 numeric digits for quick mobile login.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-end gap-2">
                <Button type="submit" variant="primary" size="sm" loading={saveCredLoading} icon={Key}>
                  Save Login Credentials
                </Button>
              </div>
            </form>
          </div>

          {/* Card 2: Security Guidelines */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authentication Guide</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-1">
                <p className="font-bold text-[#2845D6] dark:text-blue-400">Two Login Methods Supported</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Riders can enter either their registered Email & Password, or their 10-digit Mobile Number & Security PIN in the Dastak Rider App.
                </p>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p><strong>Mobile Login:</strong> Recommended for daily on-field quick dispatch check-ins.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p><strong>Email Login:</strong> Standard authentication for secure dashboard & backup access.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p><strong>Access Control:</strong> Instantly toggle the app switch to suspend access in case of device loss.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Dialog */}
      <ConfirmDialog
        isOpen={reconcileModalOpen}
        onClose={() => setReconcileModalOpen(false)}
        onConfirm={handleReconcileCod}
        loading={actionLoading}
        type="success"
        title="Reconcile Cash Collection?"
        message={`Mark ${formatCurrency(rider?.cod_collected_pending)} cash as received and deposited from ${rider?.name}.`}
        confirmText="Confirm Deposit"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteRider}
        loading={actionLoading}
        type="danger"
        title="Delete Delivery Partner?"
        message={`Are you sure you want to permanently delete ${rider?.name}? This action is irreversible and will delete their entire dispatch history and profile.`}
        confirmText="Yes, Delete Rider"
      />

      {/* Edit Form Modal */}
      <DeliveryBoyFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        rider={rider}
        onSaveSuccess={retry}
      />
    </div>
  )
}

export default DeliveryBoyDetails
