import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, RefreshCw, Eye, Ban, CheckCircle2, ShoppingBag, IndianRupee, Mail, Phone, MapPin } from 'lucide-react'
import customersApi from '../../api/customers.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatPhone, formatDate } from '../../utils/formatters'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

export const CustomerList = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)

  const [blockConfirmCustomer, setBlockConfirmCustomer] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data, loading, error, meta, retry, silentRefresh } = useApi(
    () =>
      customersApi.getCustomers({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [search, statusFilter, currentPage]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 12000)
    return () => clearInterval(interval)
  }, [silentRefresh])

  const handleToggleBlock = async () => {
    if (!blockConfirmCustomer) return
    const isCurrentlyActive = blockConfirmCustomer.status === 'ACTIVE'
    const newStatus = isCurrentlyActive ? 'BLOCKED' : 'ACTIVE'

    setActionLoading(true)
    try {
      await customersApi.toggleBlockStatus(blockConfirmCustomer.id, { status: newStatus })
      toast.success(`Customer ${blockConfirmCustomer.name} has been ${newStatus.toLowerCase()}.`)
      setBlockConfirmCustomer(null)
      retry()
    } catch (err) {
      toast.error(err.message || 'Failed to update customer status.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              row.name ? row.name.charAt(0).toUpperCase() : 'C'
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
            <div className="text-[11px] text-slate-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (row) => <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{formatPhone(row.mobile)}</span>,
    },
    {
      key: 'city',
      header: 'City',
      render: (row) => <span className="text-slate-600 dark:text-slate-400 text-xs">{row.city || 'Kanpur'}</span>,
    },
    {
      key: 'total_orders',
      header: 'Total Orders',
      align: 'right',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
          {row.total_orders || 0}
        </span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Spend (LTV)',
      align: 'right',
      render: (row) => (
        <span className="font-black text-slate-900 dark:text-slate-100">
          {formatCurrency(row.total_spent || row.ltv || 0)}
        </span>
      ),
    },
    {
      key: 'profile_completion_percentage',
      header: 'Profile',
      render: (row) => {
        const pct = row.profile_completion_percentage ?? 0
        const isComplete = pct === 100
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isComplete
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : pct >= 50
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {pct}%
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'created_at',
      header: 'Joined On',
      render: (row) => <span className="text-slate-400 text-[11px]">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/customers/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#113BD0] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="View Customer Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setBlockConfirmCustomer(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'ACTIVE'
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
            title={row.status === 'ACTIVE' ? 'Block Customer' : 'Unblock Customer'}
          >
            {row.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Customer Directory
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          View registered customer profiles, LTV & order history.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or mobile..."
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
              { value: 'ACTIVE', label: 'Active Users' },
              { value: 'BLOCKED', label: 'Blocked Users' },
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
          emptyTitle="No customers found"
          emptyDescription="Try clearing your search query or check back later."
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
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
        />
      </div>

      {/* Mobile Customer Card List View */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading customers...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No customers found.
          </div>
        ) : (
          data.map((cust) => (
            <div
              key={cust.id}
              onClick={() => navigate(`/customers/${cust.id}`)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-2.5"
            >
              {/* Header: Avatar, Name & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {cust.avatar ? (
                      <img src={cust.avatar} alt={cust.name} className="w-full h-full object-cover" />
                    ) : (
                      cust.name ? cust.name.charAt(0).toUpperCase() : 'C'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{cust.name}</h4>
                    <span className="text-[11px] text-slate-400 truncate block">{cust.email}</span>
                  </div>
                </div>

                <StatusBadge status={cust.status} size="xs" />
              </div>

              {/* Mobile & Location */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Mobile</span>
                  <a
                    href={`tel:${cust.mobile}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 group truncate"
                  >
                    <span>{formatPhone(cust.mobile)}</span>
                    <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">City</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{cust.city || 'Kanpur'}</span>
                </div>
              </div>

              {/* Footer: Orders, Total Spent (LTV) & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold">
                    {cust.total_orders || 0} Orders
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(cust.total_spent || cust.ltv || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {cust.mobile && (
                    <a
                      href={`tel:${cust.mobile}`}
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors shadow-2xs"
                      title="Call Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="View Customer Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockConfirmCustomer(cust)}
                    className={`p-1.5 rounded-lg ${
                      cust.status === 'ACTIVE'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={cust.status === 'ACTIVE' ? 'Block Customer' : 'Unblock Customer'}
                  >
                    {cust.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!blockConfirmCustomer}
        onClose={() => setBlockConfirmCustomer(null)}
        onConfirm={handleToggleBlock}
        loading={actionLoading}
        type={blockConfirmCustomer?.status === 'ACTIVE' ? 'danger' : 'success'}
        title={blockConfirmCustomer?.status === 'ACTIVE' ? 'Block Customer?' : 'Unblock Customer?'}
        message={
          blockConfirmCustomer?.status === 'ACTIVE'
            ? `Are you sure you want to block ${blockConfirmCustomer?.name}? They will not be able to place new orders on the Dastak app.`
            : `Are you sure you want to unblock ${blockConfirmCustomer?.name}? Their account will be restored to active status.`
        }
        confirmText={blockConfirmCustomer?.status === 'ACTIVE' ? 'Yes, Block' : 'Yes, Unblock'}
      />
    </div>
  )
}

export default CustomerList
