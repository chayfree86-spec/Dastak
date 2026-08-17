import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Clock,
  Receipt,
  Download,
  Calendar,
  Sparkles,
  PieChart,
  DollarSign,
  Utensils,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import customerApi from '../../api/customer.api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'

export const ReportsPage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('all')

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const res = await customerApi.getOrders({ per_page: 50 })
        setOrders(res.data?.data || res.data || [])
      } catch (e) {
        console.warn('Reports load error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="py-10 max-w-xl mx-auto">
        <EmptyState
          icon={Receipt}
          title="Sign in to View Your Reports"
          description="Log in with your customer account to view your spending report and order receipts."
          actionLabel="Sign In"
          onAction={() => navigate('/login?redirect=/reports')}
        />
      </div>
    )
  }

  // Calculate Metrics
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')
  const totalSpent = deliveredOrders.reduce(
    (sum, o) => sum + Number(o.bill?.total_amount || o.total_amount || 0),
    0
  )
  const avgOrderValue =
    deliveredOrders.length > 0 ? Math.round(totalSpent / deliveredOrders.length) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Receipt className="w-7 h-7 text-[#2845D6] dark:text-blue-400" />
          <span>Customer Spending & Activity Report</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed summary of your food orders, expenses, and billing history
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <>
          {/* 1. Bento KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Spent */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                TOTAL SPENT
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono">
                {formatCurrency(totalSpent)}
              </div>
              <span className="text-[11px] text-blue-100 font-medium block">
                Across all orders
              </span>
            </div>

            {/* Total Orders */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                TOTAL ORDERS
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {orders.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block">
                {deliveredOrders.length} Delivered
              </span>
            </div>

            {/* Average Order Value */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                AVG ORDER VALUE
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {formatCurrency(avgOrderValue)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Per meal ticket
              </span>
            </div>

            {/* Success Rate */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                DELIVERY RATE
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {orders.length > 0
                  ? `${Math.round((deliveredOrders.length / orders.length) * 100)}%`
                  : '100%'}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block">
                On-time delivery
              </span>
            </div>
          </div>

          {/* 2. Order History Ledger */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Order Billing Ledger
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                {orders.length} Records
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No billing history found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {orders.map((o) => {
                  const billTotal = o.bill?.total_amount || o.total_amount || 0
                  return (
                    <div
                      key={o.id || o.order_number}
                      onClick={() => navigate(`/orders/${o.order_number}`)}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850 p-2 rounded-2xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-black text-slate-900 dark:text-slate-100 truncate">
                            #{o.order_number} • {o.restaurant?.name || 'Partner Kitchen'}
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            {formatDateTime(o.placed_at || o.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(billTotal)}
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ReportsPage
