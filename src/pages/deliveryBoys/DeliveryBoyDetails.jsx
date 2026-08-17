import React, { useState } from 'react'
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
} from 'lucide-react'
import deliveryBoysApi from '../../api/deliveryBoys.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import DataTable from '../../components/common/DataTable'
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Bike },
    { id: 'location', label: 'Live Location', icon: MapPin },
    { id: 'active', label: 'Active Delivery', icon: Clock },
    { id: 'history', label: 'Order History', icon: ShoppingBag },
    { id: 'cod', label: 'COD Reconciliation', icon: Wallet },
    { id: 'profile', label: 'KYC & Vehicle', icon: FileText },
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
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F97316] dark:bg-orange-950/60 text-2xl font-black flex items-center justify-center shadow-xs">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{rider?.name}</h2>
              <StatusBadge status={rider?.status} size="xs" />
              <StatusBadge status={rider?.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-mono font-semibold">ID: {rider?.id}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {rider?.rating || '4.8'}
              </span>
              <span>&bull;</span>
              <span>Vehicle: <strong>{rider?.vehicle_type}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {rider?.cod_collected_pending > 0 && (
            <Button
              variant="accent"
              size="sm"
              icon={Wallet}
              onClick={() => setReconcileModalOpen(true)}
            >
              Reconcile COD ({formatCurrency(rider?.cod_collected_pending)})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            onClick={() => navigate(`/delivery-boys/${id}/id-card`)}
          >
            ID Card
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Edit}
            onClick={() => setFormModalOpen(true)}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Deliveries</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {rider?.total_deliveries || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {rider?.completed_deliveries} Completed &bull; {rider?.failed_deliveries} Cancelled
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Earnings</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(rider?.today_earnings)}
            </div>
            <span className="text-[11px] text-slate-400">Calculated per completed trip</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
            <div className="text-2xl font-black text-[#2845D6] dark:text-blue-400 mt-1">
              {formatCurrency(rider?.lifetime_earnings)}
            </div>
            <span className="text-[11px] text-slate-400">All-time platform payouts</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending COD Due</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(rider?.cod_collected_pending)}
            </div>
            <span className="text-[11px] text-amber-500 font-semibold">Cash to deposit</span>
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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Trip History</h3>
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
