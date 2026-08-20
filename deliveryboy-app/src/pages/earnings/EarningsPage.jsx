import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
} from 'lucide-react'
import deliveryApi from '../../api/delivery.api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'

export const EarningsPage = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today') // 'today' | 'week' | 'month'

  const fetchEarnings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await deliveryApi.getSummary()
      setSummary(res.data?.data || null)
    } catch (e) {
      console.warn('Failed to load earnings analytics:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  const todayEarnings = summary?.today?.earnings ?? summary?.today_earnings ?? 0
  const todayDeliveries = summary?.today?.completed_deliveries ?? summary?.today_orders_count ?? 0
  const weekEarnings = summary?.this_week?.earnings ?? summary?.weekly_earnings ?? 0
  const weekDeliveries = summary?.this_week?.completed_deliveries ?? summary?.weekly_orders_count ?? 0
  const monthEarnings = summary?.this_month?.earnings ?? summary?.monthly_earnings ?? 0
  const monthDeliveries = summary?.this_month?.completed_deliveries ?? summary?.monthly_orders_count ?? 0

  const activeEarnings =
    period === 'today' ? todayEarnings : period === 'week' ? weekEarnings : monthEarnings
  const activeDeliveries =
    period === 'today' ? todayDeliveries : period === 'week' ? weekDeliveries : monthDeliveries

  return (
    <div className="space-y-5">
      {/* 1. Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Earnings & Payouts
          </h2>
          <p className="text-xs text-slate-400">
            Real-time delivery commission and incentive breakdown
          </p>
        </div>

        <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              period === 'today'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              period === 'week'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              period === 'month'
                ? 'bg-[#113BD0] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="space-y-4">
          {/* 2. Big Highlight Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-[#113BD0] to-[#1E3A8A] text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                {period === 'today'
                  ? "TODAY'S SHIFT EARNINGS"
                  : period === 'week'
                  ? 'THIS WEEK TOTAL'
                  : 'THIS MONTH TOTAL'}
              </span>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
                <Wallet className="w-5 h-5 text-blue-100" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatCurrency(activeEarnings)}
              </div>
              <p className="text-xs text-blue-200 font-semibold">
                Earned from {activeDeliveries} successfully completed deliveries
              </p>
            </div>
          </div>

          {/* 3. Breakdown Metric Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Trip Base Fee */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Base Delivery Pay
                </span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(activeEarnings)}
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated per order distance & delivery rate
              </p>
            </div>

            {/* Performance Incentives */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Weekly Shift Incentives
                </span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(0)}
              </div>
              <p className="text-[11px] text-slate-400">
                Target milestones and peak surge bonus
              </p>
            </div>
          </div>

          {/* 4. Payout Policy Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#113BD0] dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Weekly Settlement Cycle:</strong> Fleet payouts are calculated and deposited directly to your registered bank account every Monday.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EarningsPage
