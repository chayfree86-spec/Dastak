import React, { useState, useEffect } from 'react'
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

  const { data, loading, error, retry, silentRefresh } = useApi(
    () => supportApi.getTickets({ status: statusFilter !== 'ALL' ? statusFilter : undefined, search }),
    [statusFilter, search]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 10000)
    return () => clearInterval(interval)
  }, [silentRefresh])

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
          title="Reply to Ticket"
          className="w-8 h-8 p-0 flex items-center justify-center"
        />
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Customer Support & Grievances
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Resolve complaints, order discrepancies & customer queries.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={statusFilter} onChange={setStatusFilter} />

      {/* Search Input */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by customer name or issue..."
            className="w-full h-11 sm:h-10 pl-9 pr-4 text-sm sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
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
          emptyTitle="No support tickets"
          emptyDescription="All customer inquiries and complaints have been resolved."
          onRowClick={(row) => setSelectedTicket(row)}
        />
      </div>

      {/* Mobile Support Ticket Cards */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2845D6] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading support tickets...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No support tickets found.
          </div>
        ) : (
          data.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5 text-xs active:bg-slate-50 dark:active:bg-slate-900/60 cursor-pointer"
            >
              {/* Header: ID, Customer & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#2845D6] dark:text-blue-400">
                  <span>#{ticket.id}</span>
                  <span className="font-sans font-bold text-slate-900 dark:text-slate-100">
                    &bull; {ticket.customer_name}
                  </span>
                </div>
                <StatusBadge status={ticket.status} size="xs" />
              </div>

              {/* Issue Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {ticket.subject}
                  </span>
                  {ticket.order_id && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      Order #{ticket.order_id}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ticket.message}
                </p>
              </div>

              {/* Footer: Date & Reply Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400">
                  {formatDateTime(ticket.created_at)}
                </span>

                <Button
                  variant="outline"
                  size="md"
                  icon={MessageSquare}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTicket(ticket)
                  }}
                  className="w-10 h-10 sm:w-8 sm:h-8 p-0 flex items-center justify-center rounded-xl"
                  title="Reply to Ticket"
                />
              </div>
            </div>
          ))
        )}
      </div>

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
