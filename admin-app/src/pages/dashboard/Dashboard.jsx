import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  IndianRupee,
  Activity,
  Store,
  Bike,
  Percent,
  Wallet,
  Clock,
  PlusCircle,
  Eye,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import dashboardApi from '../../api/dashboard.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatTime } from '../../utils/formatters'
import KPICard from '../../components/common/KPICard'
import StatusBadge from '../../components/common/StatusBadge'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import OrderDetailsDrawer from '../orders/OrderDetailsDrawer'
import RestaurantFormModal from '../restaurants/RestaurantFormModal'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false)

  // Real API hooks
  const { data: kpiData, loading: kpiLoading, error: kpiError, retry: retryKpi } = useApi(
    () => dashboardApi.getKpis()
  )

  const { data: orderOverview, loading: overviewLoading } = useApi(
    () => dashboardApi.getOrderOverview()
  )

  const { data: liveOps, loading: liveLoading } = useApi(
    () => dashboardApi.getLiveOperations()
  )

  const { data: recentOrders, loading: ordersLoading, error: ordersError, retry: retryOrders } = useApi(
    () => dashboardApi.getRecentOrders({ limit: 8 })
  )

  const orderColumns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (row) => (
        <span className="font-mono font-bold text-[#2845D6] dark:text-blue-400 hover:underline">
          #{row.id}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.customer_name}</span>,
    },
    {
      key: 'restaurant_name',
      header: 'Restaurant',
      render: (row) => <span className="text-slate-700 dark:text-slate-300">{row.restaurant_name}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (row) => <StatusBadge status={row.payment_method} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'delivery_boy',
      header: 'Delivery Boy',
      render: (row) => (
        <span className={row.delivery_boy === 'Unassigned' ? 'text-amber-500 font-medium' : 'text-slate-700 dark:text-slate-300'}>
          {row.delivery_boy}
        </span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => <span className="text-slate-400 text-[11px]">{formatTime(row.time)}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedOrderId(row.id)
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2845D6] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  const statusList = [
    { key: 'NEW', label: 'New', color: 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30' },
    { key: 'ACCEPTED', label: 'Accepted', color: 'border-indigo-500 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' },
    { key: 'PREPARING', label: 'Preparing', color: 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30' },
    { key: 'READY', label: 'Ready', color: 'border-teal-500 text-teal-600 bg-teal-50/50 dark:bg-teal-950/30' },
    { key: 'ASSIGNED', label: 'Assigned', color: 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/30' },
    { key: 'PICKED_UP', label: 'Picked Up', color: 'border-sky-500 text-sky-600 bg-sky-50/50 dark:bg-sky-950/30' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'border-orange-500 text-orange-600 bg-orange-50/50 dark:bg-orange-950/30' },
    { key: 'DELIVERED', label: 'Delivered', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/30' },
    { key: 'REJECTED', label: 'Rejected', color: 'border-red-500 text-red-600 bg-red-50/50 dark:bg-red-950/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#2845D6] to-[#1E35B0] text-white shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Real-Time Operations Monitor
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Live operational status across all partner restaurants and delivery boys
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setAddRestaurantOpen(true)}
            className="bg-white/20 text-white border-0 backdrop-blur-xs"
          >
            Add Restaurant
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={ShoppingBag}
            onClick={() => navigate('/orders')}
            className="bg-white/20 text-white border-0 backdrop-blur-xs"
          >
            View Orders
          </Button>
          <Button
            variant="accent"
            size="sm"
            icon={Bike}
            onClick={() => navigate('/delivery-boys')}
          >
            Delivery Fleet
          </Button>
        </div>
      </div>

      {/* 8 Real-Time Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Orders"
          value={kpiData?.today_orders}
          icon={ShoppingBag}
          color="blue"
          comparison={kpiData?.today_orders_growth}
          comparisonLabel="vs yesterday"
          loading={kpiLoading}
          onClick={() => navigate('/orders')}
        />
        <KPICard
          title="Today's Sales"
          value={formatCurrency(kpiData?.today_sales)}
          icon={IndianRupee}
          color="emerald"
          comparison={kpiData?.today_sales_growth}
          comparisonLabel="vs yesterday"
          loading={kpiLoading}
          onClick={() => navigate('/finance')}
        />
        <KPICard
          title="Active Orders"
          value={kpiData?.active_orders}
          icon={Activity}
          color="orange"
          loading={kpiLoading}
          onClick={() => navigate('/orders')}
        />
        <KPICard
          title="Active Restaurants"
          value={kpiData?.active_restaurants}
          icon={Store}
          color="purple"
          loading={kpiLoading}
          onClick={() => navigate('/restaurants')}
        />
        <KPICard
          title="Delivery Boys Online"
          value={kpiData?.delivery_boys_online}
          icon={Bike}
          color="emerald"
          loading={kpiLoading}
          onClick={() => navigate('/delivery-boys')}
        />
        <KPICard
          title="Today's Dastak Commission"
          value={formatCurrency(kpiData?.today_commission)}
          icon={Percent}
          color="blue"
          loading={kpiLoading}
          onClick={() => navigate('/finance')}
        />
        <KPICard
          title="COD Collection"
          value={formatCurrency(kpiData?.cod_collection)}
          icon={Wallet}
          color="amber"
          loading={kpiLoading}
          onClick={() => navigate('/finance')}
        />
        <KPICard
          title="Pending Settlements"
          value={formatCurrency(kpiData?.pending_settlements)}
          icon={Clock}
          color="rose"
          loading={kpiLoading}
          onClick={() => navigate('/finance')}
        />
      </div>

      {/* Order Status Pipeline Cards */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2845D6]" />
            <span>Order Pipeline Overview</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
            Manage All Orders &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {statusList.map((item) => {
            const count = orderOverview?.[item.key] || 0
            return (
              <div
                key={item.key}
                onClick={() => navigate(`/orders?status=${item.key}`)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] ${item.color}`}
              >
                <span className="text-lg font-black">{count}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Operations & Quick Stats Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operations Cards (1 Col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Fleet & Store Operations</span>
            </h3>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Restaurants Online</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Ready to accept orders</p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {liveOps?.restaurants_online || 0} / {liveOps?.total_restaurants || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-[#2845D6] dark:text-blue-400">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Delivery Boys Online</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Ready for dispatch</p>
                  </div>
                </div>
                <span className="text-sm font-black text-[#2845D6] dark:text-blue-400">
                  {liveOps?.riders_online || 0} / {liveOps?.total_riders || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100/80 dark:bg-orange-950/60 text-[#F97316]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Active Deliveries</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Currently in transit</p>
                  </div>
                </div>
                <span className="text-sm font-black text-[#F97316]">
                  {liveOps?.active_deliveries || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400 font-medium">Real-time telemetry updated</span>
          </div>
        </div>

        {/* Recent Live Orders Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#2845D6]" />
              <span>Recent Operational Orders</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={retryOrders}
            >
              Refresh
            </Button>
          </div>

          <DataTable
            columns={orderColumns}
            data={recentOrders || []}
            loading={ordersLoading}
            error={ordersError}
            onRetry={retryOrders}
            emptyTitle="No recent orders"
            emptyDescription="New incoming customer orders will appear here automatically."
            onRowClick={(row) => setSelectedOrderId(row.id)}
          />
        </div>
      </div>

      {/* Detailed Order Drawer */}
      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={() => {
            retryOrders()
            retryKpi()
          }}
        />
      )}

      {/* Add Restaurant Modal */}
      <RestaurantFormModal
        isOpen={addRestaurantOpen}
        onClose={() => setAddRestaurantOpen(false)}
        onSaved={() => {
          setAddRestaurantOpen(false)
          retryKpi()
        }}
      />
    </div>
  )
}

export default Dashboard
