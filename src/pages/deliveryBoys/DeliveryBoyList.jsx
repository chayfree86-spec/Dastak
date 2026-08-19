import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bike, PlusCircle, RefreshCw, Eye, Ban, CheckCircle2, Phone, MapPin, DollarSign, Wallet } from 'lucide-react'
import deliveryBoysApi from '../../api/deliveryBoys.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone } from '../../utils/formatters'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'
import DeliveryBoyFormModal from './DeliveryBoyFormModal'

export const DeliveryBoyList = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [onlineFilter, setOnlineFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const [statusConfirmRider, setStatusConfirmRider] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)

  const { data, loading, error, meta, retry, silentRefresh } = useApi(
    () =>
      deliveryBoysApi.getDeliveryBoys({
        search: search || undefined,
        is_online: onlineFilter === 'ONLINE' ? true : onlineFilter === 'OFFLINE' ? false : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [search, onlineFilter, statusFilter, currentPage],
    {
      initialData: [
        {
          id: 'R101',
          name: 'Rahul Pal',
          mobile: '9876543211',
          status: 'ACTIVE',
          is_online: true,
          current_order: '#D4827',
          today_deliveries: 8,
          today_earnings: 520.00,
          cod_collected: 1850.00,
          rating: 4.8,
          vehicle_type: 'Motorcycle',
        },
        {
          id: 'R102',
          name: 'Amit Singh',
          mobile: '9811224455',
          status: 'ACTIVE',
          is_online: true,
          current_order: '#D4828',
          today_deliveries: 6,
          today_earnings: 390.00,
          cod_collected: 640.00,
          rating: 4.7,
          vehicle_type: 'EV Scooter',
        },
        {
          id: 'R103',
          name: 'Vikas Kumar',
          mobile: '9899112233',
          status: 'ACTIVE',
          is_online: false,
          current_order: null,
          today_deliveries: 12,
          today_earnings: 840.00,
          cod_collected: 3200.00,
          rating: 4.9,
          vehicle_type: 'Motorcycle',
        },
        {
          id: 'R104',
          name: 'Suresh Patil',
          mobile: '9877441122',
          status: 'SUSPENDED',
          is_online: false,
          current_order: null,
          today_deliveries: 0,
          today_earnings: 0.00,
          cod_collected: 0.00,
          rating: 3.8,
          vehicle_type: 'Bicycle',
        },
      ],
    }
  )

  const handleToggleStatus = async () => {
    if (!statusConfirmRider) return
    setActionLoading(true)
    const newStatus = statusConfirmRider.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      await deliveryBoysApi.toggleStatus(statusConfirmRider.id, { status: newStatus })
      toast.success('Rider Status Updated', `${statusConfirmRider.name} status updated to ${newStatus}.`)
      setStatusConfirmRider(null)
      retry()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to update rider status.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Delivery Boy',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#F97316] font-bold text-xs flex items-center justify-center shrink-0">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/delivery-boys/${row.id}`)
              }}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#2845D6] dark:hover:text-blue-400 cursor-pointer block"
            >
              {row.name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {row.id} &bull; {row.vehicle_type}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (row) => <span className="font-mono text-slate-700 dark:text-slate-300">{formatPhone(row.mobile)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'is_online',
      header: 'Duty State',
      render: (row) => <StatusBadge status={row.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />,
    },
    {
      key: 'current_order',
      header: 'Current Order',
      render: (row) =>
        row.current_order ? (
          <span className="font-mono font-bold text-[#2845D6] dark:text-blue-400">
            {row.current_order}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Idle / Free</span>
        ),
    },
    {
      key: 'today_deliveries',
      header: "Today's Trips",
      align: 'center',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.today_deliveries || 0}</span>,
    },
    {
      key: 'today_earnings',
      header: "Today's Pay",
      align: 'right',
      render: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.today_earnings)}</span>
      ),
    },
    {
      key: 'cod_collected',
      header: 'COD Due',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(row.cod_collected)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/delivery-boys/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Inspect Rider Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStatusConfirmRider(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'ACTIVE'
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
            title={row.status === 'ACTIVE' ? 'Suspend Rider' : 'Activate Rider'}
          >
            {row.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 12000)
    return () => clearInterval(interval)
  }, [silentRefresh])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Delivery Boy Fleet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time fleet tracking, status & rider performance.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => setFormModalOpen(true)}
          className="w-full sm:w-auto h-11 sm:h-9"
        >
          Add Delivery Boy
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by rider name, mobile, or ID..."
            className="w-full h-11 sm:h-10 pl-9 pr-4 text-sm sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <CustomSelect
            value={onlineFilter}
            onChange={setOnlineFilter}
            className="w-full md:w-40"
            options={[
              { value: 'ALL', label: 'All Duty States' },
              { value: 'ONLINE', label: 'Online Only' },
              { value: 'OFFLINE', label: 'Offline Only' },
            ]}
          />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full md:w-40"
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Fleet' },
              { value: 'SUSPENDED', label: 'Suspended' },
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
          emptyTitle="No delivery boys found"
          emptyDescription="Try clearing your filters or check your network connection."
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
          onRowClick={(row) => navigate(`/delivery-boys/${row.id}`)}
        />
      </div>

      {/* Mobile Rider Card List View */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2845D6] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading fleet riders...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No delivery boys found.
          </div>
        ) : (
          data.map((rider) => (
            <div
              key={rider.id}
              onClick={() => navigate(`/delivery-boys/${rider.id}`)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-2.5"
            >
              {/* Header: Rider info & Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{rider.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400">ID: {rider.id}</span>
                    </div>
                    {rider.vehicle_type && (
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                        {rider.vehicle_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={rider.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
                  <StatusBadge status={rider.status} size="xs" />
                </div>
              </div>

              {/* Mobile, Zone & COD in Hand */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Mobile</span>
                  <a
                    href={`tel:${rider.mobile}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 group truncate"
                  >
                    <span>{formatPhone(rider.mobile)}</span>
                    <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">COD in Hand</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {formatCurrency(rider.cod_balance || rider.cod_collected_today || 0)}
                  </span>
                </div>
              </div>

              {/* Footer: Rating, Total Orders & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
                    {rider.total_orders || 0} Delivered
                  </span>
                  {rider.active_orders_count > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#2845D6] dark:text-blue-300 font-bold">
                      {rider.active_orders_count} Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {rider.mobile && (
                    <a
                      href={`tel:${rider.mobile}`}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors shadow-2xs"
                      title="Call Rider"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/delivery-boys/${rider.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="View Rider Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusConfirmRider(rider)}
                    className={`p-1.5 rounded-lg ${
                      rider.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={rider.status === 'ACTIVE' ? 'Suspend Rider' : 'Activate Rider'}
                  >
                    {rider.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Suspend/Activate Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmRider}
        onClose={() => setStatusConfirmRider(null)}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        type={statusConfirmRider?.status === 'ACTIVE' ? 'danger' : 'success'}
        title={statusConfirmRider?.status === 'ACTIVE' ? 'Suspend Delivery Boy?' : 'Activate Delivery Boy?'}
        message={
          statusConfirmRider?.status === 'ACTIVE'
            ? `Are you sure you want to suspend ${statusConfirmRider?.name}? They will immediately be taken offline and blocked from accepting order dispatches.`
            : `Are you sure you want to activate ${statusConfirmRider?.name}? They will be able to go online and receive order assignments.`
        }
        confirmText={statusConfirmRider?.status === 'ACTIVE' ? 'Yes, Suspend' : 'Yes, Activate'}
      />

      {/* Form Modal */}
      <DeliveryBoyFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaveSuccess={retry}
      />
    </div>
  )
}

export default DeliveryBoyList
