import React, { useState } from 'react'
import {
  BarChart3,
  Calendar,
  DollarSign,
  ShoppingBag,
  Percent,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Printer,
  ArrowUpRight,
  Utensils,
  Wallet,
  Clock,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import reportsApi from '../../api/reports.api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import DatePicker from '../../components/common/DatePicker'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const ReportsPage = () => {
  const [activeRange, setActiveRange] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: reportsData, loading, error, retry } = useApi(
    () =>
      reportsApi.getReports({
        range: activeRange,
        start_date: activeRange === 'custom' ? startDate || undefined : undefined,
        end_date: activeRange === 'custom' ? endDate || undefined : undefined,
      }),
    [activeRange, startDate, endDate]
  )

  const rep = reportsData || {}
  const summary = rep.summary || {}
  const daily = rep.daily_breakdown || []
  const topItems = rep.top_items || []

  const ranges = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week (7D)' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom Date' },
  ]

  const handlePrint = () => {
    window.print()
  }

  const grossSales = Number(summary.gross_sales || summary.total_sales || 0)
  const deliveredOrders = Number(summary.delivered_orders || summary.total_orders || 0)
  const netPayout = Number(summary.net_payout || (grossSales * 0.85))
  const commission = Number(summary.commission_amount || (grossSales * 0.15))
  const aov = deliveredOrders > 0 ? (grossSales / deliveredOrders) : 0

  return (
    <div className="space-y-6 w-full print:p-0">
      {/* 1. Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#113BD0]/10 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span>Sales & Revenue Reports</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            Financial breakdown, platform commission deductions, and net restaurant payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRange(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeRange === r.id
                  ? 'bg-[#113BD0] text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {activeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="w-36">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="From Date"
                size="sm"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">to</span>
            <div className="w-36">
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="To Date"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState title="Unable to load reports" message={error} onRetry={() => retry()} />}

      {!loading && !error && (
        <>
          {/* 3. Summary Bento Stat Cards (2x2 on Mobile, 4-col on Desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard
              title="Gross Sales (GMV)"
              value={formatCurrency(grossSales)}
              change={`${deliveredOrders} orders`}
              icon={ShoppingBag}
              trend="up"
              color="blue"
            />
            <StatCard
              title="Net Payout"
              value={formatCurrency(netPayout)}
              change="To bank account"
              icon={Wallet}
              trend="up"
              color="green"
            />
            <StatCard
              title="Dastak Fee (15%)"
              value={formatCurrency(commission)}
              change="Platform fee"
              icon={Percent}
              trend="neutral"
              color="orange"
            />
            <StatCard
              title="Avg. Order (AOV)"
              value={formatCurrency(aov)}
              change="Per basket"
              icon={TrendingUp}
              trend="up"
              color="purple"
            />
          </div>

          {/* 4. Two-Column Insights: Daily Breakdown + Top Selling Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Daily Settlement & Breakdown (Takes 2 Columns) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#113BD0]" />
                  <span>Daily Sales Breakdown</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {daily.length} record{daily.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                {daily.length === 0 ? (
                  <div className="p-8 sm:p-10 text-center text-slate-400">
                    <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold">No orders recorded in this date range.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card List View (< sm) */}
                    <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                      {daily.map((d, idx) => (
                        <div key={idx} className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                              {d.date || d.day || 'Today'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                              {d.order_count || d.orders || 0} orders
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 dark:border-slate-700/40">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Gross Sales</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {formatCurrency(d.gross_sales || d.sales || 0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Commission</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                -{formatCurrency(d.commission || (d.gross_sales * 0.15) || 0)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Net Payout</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(d.net_payout || ((d.gross_sales || d.sales || 0) * 0.85))}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop / Tablet Table View (>= sm) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Orders</th>
                            <th className="py-3 px-4">Gross Sales</th>
                            <th className="py-3 px-4">Commission</th>
                            <th className="py-3 px-4 text-right">Net Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-800 dark:text-slate-200">
                          {daily.map((d, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                {d.date || d.day || 'Today'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                  {d.order_count || d.orders || 0} orders
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold">
                                {formatCurrency(d.gross_sales || d.sales || 0)}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {formatCurrency(d.commission || (d.gross_sales * 0.15) || 0)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(d.net_payout || ((d.gross_sales || d.sales || 0) * 0.85))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top Selling Food Items Column (Takes 1 Column) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Top Selling Items</span>
                </h3>
              </div>

              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                {topItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold">Sales data will rank items automatically.</p>
                  </div>
                ) : (
                  topItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {item.quantity_sold || item.units || 1} units sold
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.total_revenue || item.revenue || 0)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payout Schedule Information Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-[#113BD0] dark:text-blue-400" />
                  <span>Settlement Cycle</span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300 leading-relaxed">
                  Net payouts are automatically settled to your verified bank account on a weekly basis every Monday.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsPage
