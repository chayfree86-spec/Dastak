import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Store, Filter, RefreshCw, Eye, Edit2, Ban, CheckCircle2, UtensilsCrossed } from 'lucide-react'
import restaurantsApi from '../../api/restaurants.api'
import { useApi } from '../../hooks/useApi'
import { formatPhone } from '../../utils/formatters'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RestaurantFormModal from './RestaurantFormModal'
import { useToast } from '../../context/ToastContext'

export const RestaurantList = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [cycleFilter, setCycleFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [statusConfirmRestaurant, setStatusConfirmRestaurant] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data, loading, error, meta, retry } = useApi(
    () =>
      restaurantsApi.getRestaurants({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        settlement_cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [search, statusFilter, cycleFilter, currentPage]
  )

  const handleToggleStatus = async () => {
    if (!statusConfirmRestaurant) return
    setActionLoading(true)
    const newStatus = statusConfirmRestaurant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      await restaurantsApi.toggleStatus(statusConfirmRestaurant.id, { status: newStatus })
      toast.success('Status Updated', `${statusConfirmRestaurant.name} status updated to ${newStatus}.`)
      setStatusConfirmRestaurant(null)
      retry()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Restaurant',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2845D6] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/restaurants/${row.id}`)
              }}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#2845D6] dark:hover:text-blue-400 cursor-pointer block"
            >
              {row.name}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              ★ {row.rating || '4.5'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'owner_name',
      header: 'Owner',
      render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.owner_name}</span>,
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (row) => <span className="font-mono text-slate-600 dark:text-slate-400">{formatPhone(row.mobile)}</span>,
    },
    {
      key: 'city',
      header: 'Location',
      render: (row) => <span className="text-slate-600 dark:text-slate-400">{row.city}</span>,
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">{row.commission}%</span>
      ),
    },
    {
      key: 'settlement_cycle',
      header: 'Settlement',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {row.settlement_cycle}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'is_online',
      header: 'Store State',
      render: (row) => <StatusBadge status={row.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />,
    },
    {
      key: 'total_orders',
      header: 'Orders',
      align: 'right',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.total_orders || 0}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/restaurants/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="View Details & Menu"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingRestaurant(row)
              setIsModalOpen(true)
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Edit Restaurant"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStatusConfirmRestaurant(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'ACTIVE'
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
            title={row.status === 'ACTIVE' ? 'Suspend Restaurant' : 'Activate Restaurant'}
          >
            {row.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Partner Restaurants
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage partner onboarding, commission terms, menus, and operational status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => {
              setEditingRestaurant(null)
              setIsModalOpen(true)
            }}
          >
            Add Restaurant
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name, owner, or mobile..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full md:w-40"
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'SUSPENDED', label: 'Suspended Only' },
            ]}
          />
          <CustomSelect
            value={cycleFilter}
            onChange={setCycleFilter}
            className="w-full md:w-44"
            options={[
              { value: 'ALL', label: 'All Settlements' },
              { value: 'DAILY', label: 'Daily Cycle' },
              { value: 'WEEKLY', label: 'Weekly Cycle' },
              { value: 'MONTHLY', label: 'Monthly Cycle' },
            ]}
          />
        </div>
      </div>

      {/* Restaurants Table */}
      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No restaurants found"
        emptyDescription="Try adjusting your search criteria or add a new restaurant partner."
        emptyActionLabel="Add Restaurant"
        onEmptyAction={() => {
          setEditingRestaurant(null)
          setIsModalOpen(true)
        }}
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
        onRowClick={(row) => navigate(`/restaurants/${row.id}`)}
      />

      {/* Add / Edit Restaurant Modal */}
      <RestaurantFormModal
        isOpen={isModalOpen}
        restaurant={editingRestaurant}
        onClose={() => setIsModalOpen(false)}
        onSaved={retry}
      />

      {/* Suspend / Activate Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmRestaurant}
        onClose={() => setStatusConfirmRestaurant(null)}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        type={statusConfirmRestaurant?.status === 'ACTIVE' ? 'danger' : 'success'}
        title={statusConfirmRestaurant?.status === 'ACTIVE' ? 'Suspend Restaurant?' : 'Activate Restaurant?'}
        message={
          statusConfirmRestaurant?.status === 'ACTIVE'
            ? `Are you sure you want to suspend ${statusConfirmRestaurant?.name}? They will no longer be visible to customers for orders.`
            : `Are you sure you want to activate ${statusConfirmRestaurant?.name}? They will be able to take customer orders immediately.`
        }
        confirmText={statusConfirmRestaurant?.status === 'ACTIVE' ? 'Yes, Suspend' : 'Yes, Activate'}
      />
    </div>
  )
}

export default RestaurantList
