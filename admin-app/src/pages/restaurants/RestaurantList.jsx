import React, { useState, useEffect } from 'react'
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

  const { data, loading, error, meta, retry, silentRefresh } = useApi(
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

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 12000)
    return () => clearInterval(interval)
  }, [silentRefresh])

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
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/restaurants/${row.id}`)
              }}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#113BD0] dark:hover:text-blue-400 cursor-pointer block"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#113BD0] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Partner Restaurants
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage partner onboarding, commission, menus & stores.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => {
            setEditingRestaurant(null)
            setIsModalOpen(true)
          }}
          className="w-full sm:w-auto h-11 sm:h-9"
        >
          Add Restaurant
        </Button>
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
            className="w-full h-11 sm:h-10 pl-9 pr-4 text-sm sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0]"
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

      {/* Desktop Table View */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile Restaurant Card List View */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading restaurants...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No restaurants found.
          </div>
        ) : (
          data.map((rest) => (
            <div
              key={rest.id}
              onClick={() => navigate(`/restaurants/${rest.id}`)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-2.5"
            >
              {/* Header: Name, Logo Initial, Rating & Status Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {rest.name ? rest.name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{rest.name}</h4>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      ★ {rest.rating || '4.5'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={rest.is_online ? 'ONLINE' : 'OFFLINE'} size="xs" />
                  <StatusBadge status={rest.status} size="xs" />
                </div>
              </div>

              {/* Owner, Mobile & Location */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Owner</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{rest.owner_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Mobile</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">{formatPhone(rest.mobile)}</span>
                </div>
              </div>

              {/* Footer: Commission, Settlement & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#113BD0] dark:text-blue-400 font-bold">
                    {rest.commission}% Comm
                  </span>
                  <span className="text-slate-400 font-medium">
                    {rest.settlement_cycle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRestaurant(rest)
                      setIsModalOpen(true)
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Edit Restaurant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusConfirmRestaurant(rest)}
                    className={`p-1.5 rounded-lg ${
                      rest.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={rest.status === 'ACTIVE' ? 'Suspend Restaurant' : 'Activate Restaurant'}
                  >
                    {rest.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
