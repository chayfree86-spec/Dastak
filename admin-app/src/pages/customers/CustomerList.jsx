import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, RefreshCw, Eye, Ban, CheckCircle2, ShoppingBag, IndianRupee } from 'lucide-react'
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

  const { data, loading, error, meta, retry } = useApi(
    () =>
      customersApi.getCustomers({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        per_page: 10,
      }),
    [search, statusFilter, currentPage]
  )

  const handleToggleBlock = async () => {
    if (!blockConfirmCustomer) return
    setActionLoading(true)
    const newStatus = blockConfirmCustomer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      await customersApi.toggleBlock(blockConfirmCustomer.id, { status: newStatus })
      toast.success('Customer Status Updated', `${blockConfirmCustomer.name} is now ${newStatus}.`)
      setBlockConfirmCustomer(null)
      retry()
    } catch (err) {
      toast.error('Action Failed', err.message || 'Unable to update customer status.')
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
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <span
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/customers/${row.id}`)
              }}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#2845D6] dark:hover:text-blue-400 cursor-pointer block"
            >
              {row.name}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
              {row.email || 'No email registered'}
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
      key: 'city',
      header: 'City',
      render: (row) => <span className="text-slate-600 dark:text-slate-400">{row.city}</span>,
    },
    {
      key: 'total_orders',
      header: 'Orders',
      align: 'center',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.total_orders || 0}</span>,
    },
    {
      key: 'total_spend',
      header: 'Total Spend',
      align: 'right',
      render: (row) => (
        <span className="font-black text-[#2845D6] dark:text-blue-400">{formatCurrency(row.total_spend)}</span>
      ),
    },
    {
      key: 'last_order_date',
      header: 'Last Order',
      render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.last_order_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/customers/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="View Profile"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View registered customer profiles, lifetime value (LTV), addresses, and order history.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
          Refresh List
        </Button>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or mobile..."
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
              { value: 'ACTIVE', label: 'Active Users' },
              { value: 'BLOCKED', label: 'Blocked Users' },
            ]}
          />
        </div>
      </div>

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
