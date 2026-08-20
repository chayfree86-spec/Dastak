import React, { useState, useMemo } from 'react'
import {
  Wallet,
  CheckCircle,
  Clock,
  ArrowDownRight,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  Building,
  CreditCard,
  FileText,
  X,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import reportsApi from '../../api/reports.api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import Button from '../../components/common/Button'
import DatePicker from '../../components/common/DatePicker'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Modal from '../../components/common/Modal'

export const SettlementsPage = () => {
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSettlement, setSelectedSettlement] = useState(null)

  const { data: settlementsData, loading, error, retry } = useApi(
    () =>
      reportsApi.getSettlements({
        status: activeStatus === 'ALL' ? undefined : activeStatus,
        search: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        per_page: 50,
      }),
    [activeStatus, searchQuery, startDate, endDate]
  )

  const settlements = useMemo(() => {
    return Array.isArray(settlementsData?.data)
      ? settlementsData.data
      : Array.isArray(settlementsData)
      ? settlementsData
      : []
  }, [settlementsData])

  // Summary Metrics calculated from active settlements
  const metrics = useMemo(() => {
    let totalPaid = 0
    let totalProcessing = 0
    let totalOrders = 0
    let grossTotal = 0

    settlements.forEach((s) => {
      const net = Number(s.net_payable ?? s.net_payout_amount ?? s.amount ?? 0)
      const gross = Number(s.gross_sales ?? (net / 0.85))
      const count = Number(s.total_orders_count ?? 0)

      grossTotal += gross
      totalOrders += count

      if (s.status === 'PAID' || s.status === 'SETTLED') {
        totalPaid += net
      } else {
        totalProcessing += net
      }
    })

    return { totalPaid, totalProcessing, totalOrders, grossTotal }
  }, [settlements])

  const statusTabs = [
    { id: 'ALL', label: 'All Payouts' },
    { id: 'PAID', label: 'Transferred (Paid)' },
    { id: 'PROCESSING', label: 'In Processing' },
    { id: 'PENDING', label: 'Upcoming / Pending' },
  ]

  const clearFilters = () => {
    setActiveStatus('ALL')
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = activeStatus !== 'ALL' || searchQuery || startDate || endDate

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#113BD0]/10 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <span>Restaurant Settlements & Payouts</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            Monitor bank payout transfer history, weekly settlement cycles, and automated disbursements.
          </p>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Bento Summary KPI Cards (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Settled to Bank */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">Transferred</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 hidden sm:block">Directly credited to verified bank</p>
        </div>

        {/* Current Cycle / Processing */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">Processing</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(metrics.totalProcessing)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 hidden sm:block">Disbursed on scheduled weekly cycle</p>
        </div>

        {/* Total Orders Covered */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">Orders</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.totalOrders} <span className="text-xs font-sans text-slate-400 font-normal">orders</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 hidden sm:block">Across all completed batches</p>
        </div>

        {/* Payout Channel Info */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#113BD0]/5 to-[#113BD0]/15 dark:from-blue-950/30 dark:to-blue-900/10 border border-[#113BD0]/20 dark:border-blue-800/40 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-300 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">Settlement</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#113BD0]/20 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>NEFT / IMPS</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Every Monday 06:00 AM</p>
        </div>
      </div>

      {/* 3. Filter Bar: Status Tabs, Search & Date Range Picker */}
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3 sm:space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none border-b border-slate-100 dark:border-slate-700/60 pb-3">
          {statusTabs.map((tab) => {
            const isActive = activeStatus === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#113BD0] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search & Custom Date Picker Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          {/* Search by Reference / UTR */}
          <div className="sm:col-span-2 md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Settlement # or Bank UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 sm:h-12 pl-10 pr-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#113BD0] focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* From Date */}
          <div className="md:col-span-3">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              placeholder="From Cycle Date"
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-3">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              placeholder="To Cycle Date"
            />
          </div>
        </div>
      </div>

      {/* 4. Loading & Error States */}
      {loading && <LoadingSkeleton count={3} />}
      {error && <ErrorState title="Unable to load settlements" message={error} onRetry={() => retry()} />}

      {/* 5. Empty State */}
      {!loading && !error && settlements.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No Settlement Records Found"
          description={
            hasActiveFilters
              ? 'No settlements match your selected filters. Try changing or resetting the filters.'
              : 'Your completed order earnings will be grouped into scheduled payout cycles and transferred to your bank account.'
          }
          actionText={hasActiveFilters ? 'Clear All Filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
          className="py-16"
        />
      )}

      {/* 6. Filtered Settlements List */}
      <div className="space-y-3">
        {settlements.map((item) => {
          const isPaid = item.status === 'PAID' || item.status === 'SETTLED'
          const isProcessing = item.status === 'PROCESSING'
          const netAmount = item.net_payable ?? item.net_payout_amount ?? item.amount ?? 0
          const grossAmount = item.gross_sales ?? (Number(netAmount) / 0.85)
          const feeAmount = item.platform_commission ?? item.commission_deducted ?? (grossAmount * 0.15)
          const pStart = item.period_start || item.start_date || 'Earlier'
          const pEnd = item.period_end || item.end_date || 'Recent'
          const refNumber = item.settlement_number || item.reference || item.id
          const utr = item.payout_reference || item.transaction_reference

          return (
            <div
              key={item.id || refNumber}
              onClick={() => setSelectedSettlement(item)}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                    isPaid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30'
                      : isProcessing
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                  }`}
                >
                  {isPaid ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : isProcessing ? (
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
                  ) : (
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-[#113BD0] dark:group-hover:text-blue-400 transition-colors">
                      Settlement #{refNumber}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase border ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                          : isProcessing
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                      }`}
                    >
                      {item.status || 'PENDING'}
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
                    Cycle: <strong className="text-slate-700 dark:text-slate-200">{pStart}</strong> to{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{pEnd}</strong>
                    {item.total_orders_count > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        {item.total_orders_count} orders
                      </span>
                    )}
                  </p>

                  {utr && (
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      UTR: <span className="font-bold text-slate-800 dark:text-slate-200">{utr}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-700">
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-sans block font-bold uppercase tracking-wider">
                    {isPaid ? 'Net Transferred' : 'Estimated Net'}
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                    {formatCurrency(netAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Gross: {formatCurrency(grossAmount)} | Fee: -{formatCurrency(feeAmount)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#113BD0] group-hover:text-white dark:group-hover:bg-blue-600 text-slate-400 flex items-center justify-center transition-all shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 7. Detailed Settlement Statement Modal */}
      <Modal
        isOpen={!!selectedSettlement}
        onClose={() => setSelectedSettlement(null)}
        title={`Settlement Statement #${selectedSettlement?.settlement_number || selectedSettlement?.reference || selectedSettlement?.id}`}
        subtitle="Complete payout calculation and disbursement breakdown"
        maxWidth="max-w-xl"
      >
        {selectedSettlement && (
          <div className="space-y-4 sm:space-y-5">
            {/* Status Strip */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Status</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  {selectedSettlement.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Cycle</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedSettlement.period_start || selectedSettlement.start_date} to {selectedSettlement.period_end || selectedSettlement.end_date}
                </span>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Total Eligible Orders</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedSettlement.total_orders_count || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Gross Food Sales (GMV)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(selectedSettlement.gross_sales || ((selectedSettlement.net_payable || selectedSettlement.amount) / 0.85))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                <span>Dastak Platform Fee (15%)</span>
                <span className="font-bold">
                  -{formatCurrency(selectedSettlement.platform_commission || selectedSettlement.commission_deducted || ((selectedSettlement.gross_sales || 0) * 0.15))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <span>TDS / Tax Withheld</span>
                <span className="font-bold">
                  {formatCurrency(selectedSettlement.tax_deducted || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm">
                <span className="font-black text-slate-900 dark:text-slate-100">Final Net Payout</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {formatCurrency(selectedSettlement.net_payable ?? selectedSettlement.net_payout_amount ?? selectedSettlement.amount ?? 0)}
                </span>
              </div>
            </div>

            {/* Payout Banking Details */}
            {(selectedSettlement.payout_reference || selectedSettlement.payout_method) && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#113BD0] dark:text-blue-400 font-black uppercase text-[10px] tracking-wider">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Transfer Information</span>
                </div>
                {selectedSettlement.payout_reference && (
                  <p className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                    Bank UTR: <strong>{selectedSettlement.payout_reference}</strong>
                  </p>
                )}
                {selectedSettlement.paid_at && (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Disbursed on: {formatDate(selectedSettlement.paid_at)}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="w-full h-12 rounded-xl sm:rounded-2xl bg-[#113BD0] hover:bg-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-98 transition-all cursor-pointer select-none"
              >
                Close Statement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SettlementsPage
