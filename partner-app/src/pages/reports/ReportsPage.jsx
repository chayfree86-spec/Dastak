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
  FileSpreadsheet,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import reportsApi from '../../api/reports.api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
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
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#2845D6]" />
            <span>Sales & Revenue Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Financial breakdown, platform commission deductions, and net restaurant earnings.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => retry()}>
          Refresh
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto select-none">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRange(r.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                activeRange === r.id
                  ? 'bg-[#2845D6] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {activeRange === 'custom' && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent p-1 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent p-1 focus:outline-none"
            />
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton count={3} />}
      {error && <ErrorState title="Unable to load reports" message={error} onRetry={() => retry()} />}

      {!loading && !error && (
        <>
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Gross Sales"
              value={formatCurrency(summary.gross_sales)}
              subtitle={`${summary.delivered_orders || 0} Delivered orders`}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Net Restaurant Payout"
              value={formatCurrency(summary.net_restaurant_payout)}
              subtitle="Payable amount to your bank"
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Platform Commission"
              value={formatCurrency(summary.platform_commission)}
              subtitle="Dastak service fee"
              icon={Percent}
              color="orange"
            />
            <StatCard
              title="Avg Order Value (AOV)"
              value={formatCurrency(summary.average_order_value)}
              subtitle="Per delivered order"
              icon={ShoppingBag}
              color="purple"
            />
          </div>

          {/* Detailed Statistics Breakdown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Top Best Selling Items in Range */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Top Selling Food Items
              </h3>
              {topItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No item sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {topItems.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-50 text-[#2845D6] font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{it.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 block">{formatCurrency(it.amount)}</span>
                        <span className="text-[10px] text-slate-400">{it.quantity} sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Breakdown Table */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Daily Sales & Payout Breakdown
              </h3>
              {daily.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No daily records found in this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5 text-center">Orders</th>
                        <th className="py-2.5 text-right">Gross Sales</th>
                        <th className="py-2.5 text-right">Commission</th>
                        <th className="py-2.5 text-right">Net Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {daily.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3 font-sans font-bold text-slate-800">{row.date}</td>
                          <td className="py-3 text-center text-slate-600 font-sans">{row.orders_count}</td>
                          <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(row.sales)}</td>
                          <td className="py-3 text-right text-orange-600">-{formatCurrency(row.commission)}</td>
                          <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(row.payout)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsPage
