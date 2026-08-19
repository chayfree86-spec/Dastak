import React, { useState } from 'react'
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

  const { data, loading, error, meta, retry } = useApi(
    () =>
      deliveryBoysApi.getDeliveryBoys({
        search: search || undefined,
        is_online: onlineFilter === 'ONLINE' ? true : onlineFilter === 'OFFLINE' ? false : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [search, onlineFilter, statusFilter, currentPage]
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Delivery Boy Fleet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time fleet tracking, online status, COD reconciliation, and rider performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
            Refresh Fleet
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setFormModalOpen(true)}
          >
            Add Delivery Boy
          </Button>
        </div>
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
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
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

      {/* Table */}
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
