import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  DollarSign,
  UtensilsCrossed,
  BarChart3,
  Star,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Wallet,
  AlertCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import reportsApi from '../../api/reports.api'
import { formatCurrency } from '../../utils/formatters'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const DashboardPage = () => {
  const { restaurant } = useAuth()
  const navigate = useNavigate()

  const { data: dashboardData, loading, error, retry } = useApi(
    () => reportsApi.getDashboard(),
    []
  )

  const summary = dashboardData || {}
  const kpis = summary.kpis || {}
  const today = summary.today || {}
  const restInfo = summary.restaurant || restaurant || {}

  return (
    <div className="space-y-6 w-full">
      {/* 1. Top Banner with Gradient & High Contrast */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#102A43] via-[#1E3A8A] to-[#2845D6] text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs">
              Kitchen Operations Hub
            </span>
            <span className="flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>
                {restInfo.rating ? `${Number(restInfo.rating).toFixed(1)} (${restInfo.total_ratings || 0} ratings)` : 'Partner Kitchen'}
              </span>
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            {restInfo.name || restaurant?.name || 'Kitchen Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
            Live operational dashboard with real database analytics, orders queue & sales metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => retry()}
          className="bg-white/10 text-white border-white/20 hover:bg-white/25 hover:text-white shadow-xs relative z-10 shrink-0"
        >
          Refresh Stats
        </Button>
      </div>

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState title="Unable to load dashboard" message={error} onRetry={() => retry()} />}

      {!loading && !error && (
        <>
          {/* 2. Active Kitchen Pipeline Quick Counters (4 Cards Grid) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Live Kitchen Pipeline</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Click card to view orders</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* New Pending Card */}
              <div
                onClick={() => navigate('/new-orders')}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-[#F97316] dark:hover:border-[#F97316] shadow-xs hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    New Pending
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {kpis.new_pending_count ?? 0}
                </div>
                <span className="text-[11px] font-bold text-[#F97316] mt-1 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Requires Action &rarr;
                </span>
              </div>

              {/* Preparing Card */}
              <div
                onClick={() => navigate('/orders')}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-400 shadow-xs hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Preparing
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ChefHat className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {kpis.preparing_count ?? 0}
                </div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Cooking in Kitchen &rarr;
                </span>
              </div>

              {/* Ready for Pickup Card */}
              <div
                onClick={() => navigate('/orders')}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-400 shadow-xs hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Ready for Pickup
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Bike className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {kpis.ready_count ?? 0}
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Awaiting Rider &rarr;
                </span>
              </div>

              {/* Total Active Card */}
              <div
                onClick={() => navigate('/orders')}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-blue-400 shadow-xs hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Total Active
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  {kpis.active_kitchen_orders ?? 0}
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
                  In Progress Orders
                </span>
              </div>
            </div>
          </div>

          {/* 3. Performance & Financial Metrics Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3">
              Performance & Financial Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                title="Today's Delivered Sales"
                value={formatCurrency(today.sales || 0)}
                change={today.sales > 0 ? `${today.delivered_orders || 0} orders today` : '0 orders placed today'}
                icon={TrendingUp}
                trend="up"
              />
              <StatCard
                title="Estimated Net Payout"
                value={formatCurrency(today.net_payout || 0)}
                change="After platform commission"
                icon={DollarSign}
                trend="neutral"
              />
              <StatCard
                title="Delivered Orders"
                value={summary.lifetime?.delivered_orders || today.delivered_orders || 0}
                change="Lifetime successful orders"
                icon={CheckCircle2}
                trend="up"
              />
              <StatCard
                title="Gross Sales (GMV)"
                value={formatCurrency(summary.lifetime?.gross_sales || today.sales || 0)}
                change="All completed orders"
                icon={ShoppingBag}
                trend="up"
              />
            </div>
          </div>

          {/* 4. Quick Action Short-Cuts matching Admin */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3">
              Quick Management Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div
                onClick={() => navigate('/new-orders')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-[#2845D6] dark:hover:border-blue-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316] flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#2845D6] dark:group-hover:text-blue-400 transition-colors">
                      New Order Queue
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                      Accept or reject pending orders
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#2845D6] transition-colors" />
              </div>

              <div
                onClick={() => navigate('/menu')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-[#2845D6] dark:hover:border-blue-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2845D6] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#2845D6] dark:group-hover:text-blue-400 transition-colors">
                      Manage Menu & Stock
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                      1-click item availability switch
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#2845D6] transition-colors" />
              </div>

              <div
                onClick={() => navigate('/reports')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 hover:border-[#2845D6] dark:hover:border-blue-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#2845D6] dark:group-hover:text-blue-400 transition-colors">
                      Sales Reports
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                      View payout breakdown & charts
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#2845D6] transition-colors" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardPage
