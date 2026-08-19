import React, { useState } from 'react'
import { Search, HelpCircle, RefreshCw, Eye, MessageSquare, AlertCircle } from 'lucide-react'
import supportApi from '../../api/support.api'
import { useApi } from '../../hooks/useApi'
import { formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import TicketDetailsModal from './TicketDetailsModal'

export const SupportTickets = () => {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)

  const { data, loading, error, retry } = useApi(
    () => supportApi.getTickets({ status: statusFilter !== 'ALL' ? statusFilter : undefined, search }),
    [statusFilter, search]
  )

  const tabs = [
    { id: 'ALL', label: 'All Tickets' },
    { id: 'OPEN', label: 'Open' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'RESOLVED', label: 'Resolved' },
  ]

  const columns = [
    {
      key: 'id',
      header: 'Ticket ID',
      render: (row) => <span className="font-mono font-bold text-[#2845D6] dark:text-blue-400">#{row.id}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.customer_name}</span>,
    },
    {
      key: 'order_id',
      header: 'Order Ref',
      render: (row) => (
        row.order_id ? (
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">#{row.order_id}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'subject',
      header: 'Issue Subject',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">{row.subject}</span>
          <span className="text-[11px] text-slate-400 truncate max-w-xs block">{row.message}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'created_at',
      header: 'Created Time',
      render: (row) => <span className="text-slate-400 text-xs">{formatDateTime(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={MessageSquare}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedTicket(row)
          }}
        >
          Reply
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Support & Grievances
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Resolve customer complaints, order discrepancies, and partner queries.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
          Refresh Queue
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={statusFilter} onChange={setStatusFilter} />

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by customer name or issue..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No support tickets"
        emptyDescription="All customer inquiries and complaints have been resolved."
        onRowClick={(row) => setSelectedTicket(row)}
      />

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={retry}
        />
      )}
    </div>
  )
}

export default SupportTickets
