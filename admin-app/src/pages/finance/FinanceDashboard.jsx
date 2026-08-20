import React, { useState, useEffect } from 'react'
import {
  Wallet,
  IndianRupee,
  Percent,
  Bike,
  Store,
  CreditCard,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  PlusCircle,
} from 'lucide-react'
import financeApi from '../../api/finance.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import KPICard from '../../components/common/KPICard'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import Modal from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'

export const FinanceDashboard = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('settlements')
  const [cycleFilter, setCycleFilter] = useState('ALL')
  const [settleModalItem, setSettleModalItem] = useState(null)
  const [payoutRef, setPayoutRef] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Commission Edit State
  const [editingCommissionRest, setEditingCommissionRest] = useState(null)
  const [newCommissionRate, setNewCommissionRate] = useState('')

  // Delivery Rule State
  const [deliveryRules, setDeliveryRules] = useState([])

  const { data: summary, loading: summaryLoading, retry: retrySummary, silentRefresh: silentRefreshSummary } = useApi(
    () => financeApi.getFinanceSummary()
  )

  useEffect(() => {
    if (summary?.delivery_rules && Array.isArray(summary.delivery_rules)) {
      setDeliveryRules(summary.delivery_rules)
    }
  }, [summary])

  const { data: settlements, loading: settleLoading, retry: retrySettlements, silentRefresh: silentRefreshSettlements } = useApi(
    () => financeApi.getSettlements({ cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined }),
    [cycleFilter]
  )

  const { data: commissions, loading: commLoading, retry: retryCommissions, silentRefresh: silentRefreshCommissions } = useApi(
    () => financeApi.getRestaurantCommissions()
  )

  const handleProcessSettlement = async () => {
    if (!payoutRef.trim()) {
      toast.warning('Reference Required', 'Please enter bank transaction / UTR reference.')
      return
    }
    setActionLoading(true)
    try {
      await financeApi.processSettlement(settleModalItem.id, {
        reference: payoutRef,
        amount: settleModalItem.payable_amount,
      })
      toast.success('Settlement Processed', `Marked ${settleModalItem.id} as settled.`)
      setSettleModalItem(null)
      setPayoutRef('')
      retrySettlements()
      retrySummary()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to process settlement.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveCommission = async () => {
    if (!newCommissionRate) return
    setActionLoading(true)
    try {
      await financeApi.updateRestaurantCommission(editingCommissionRest.id, {
        commission: Number(newCommissionRate),
      })
      toast.success('Commission Updated', `${editingCommissionRest.restaurant_name} commission updated to ${newCommissionRate}%.`)
      setEditingCommissionRest(null)
      retryCommissions()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update commission.')
    } finally {
      setActionLoading(false)
    }
  }

  const tabs = [
    { id: 'settlements', label: 'Restaurant Settlements', icon: Store },
    { id: 'commissions', label: 'Commission Rates', icon: Percent },
    { id: 'delivery_rules', label: 'Delivery Charge Rules', icon: Bike },
  ]

  const settlementColumns = [
    {
      key: 'id',
      header: 'Settlement ID',
      render: (row) => <span className="font-mono font-bold text-[#113BD0] dark:text-blue-400">#{row.id}</span>,
    },
    {
      key: 'restaurant_name',
      header: 'Restaurant',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.restaurant_name}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      render: (row) => <span className="text-slate-600 dark:text-slate-400 text-xs">{row.period}</span>,
    },
    {
      key: 'orders_count',
      header: 'Orders',
      align: 'center',
      render: (row) => <span className="font-semibold">{row.orders_count}</span>,
    },
    {
      key: 'gross_sales',
      header: 'Gross Sales',
      align: 'right',
      render: (row) => <span className="font-bold">{formatCurrency(row.gross_sales)}</span>,
    },
    {
      key: 'commission_deducted',
      header: 'Commission (-)',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-[#113BD0] dark:text-blue-400">
          -{formatCurrency(row.commission_deducted)}
        </span>
      ),
    },
    {
      key: 'payable_amount',
      header: 'Net Payable',
      align: 'right',
      render: (row) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(row.payable_amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSettleModalItem(row)}
          >
            Process Pay
          </Button>
        ) : (
          <span className="text-emerald-600 text-xs font-bold flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        ),
    },
  ]

  const commissionColumns = [
    {
      key: 'restaurant_name',
      header: 'Restaurant',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{row.restaurant_name}</span>,
    },
    {
      key: 'commission',
      header: 'Commission %',
      render: (row) => (
        <span className="text-sm font-black text-[#113BD0] dark:text-blue-400">{row.commission}%</span>
      ),
    },
    {
      key: 'effective_from',
      header: 'Effective Date',
      render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.effective_from)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingCommissionRest(row)
            setNewCommissionRate(String(row.commission))
          }}
        >
          Change %
        </Button>
      ),
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefreshSummary()
      silentRefreshSettlements()
      silentRefreshCommissions()
    }, 15000)
    return () => clearInterval(interval)
  }, [silentRefreshSummary, silentRefreshSettlements, silentRefreshCommissions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Financial Health & Settlements
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track sales, commission, settlements & payouts.
        </p>
      </div>

      {/* 4 Core Financial KPI Cards (2-col on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <KPICard
          title="Gross Sales"
          value={formatCurrency(summary?.gross_sales)}
          icon={IndianRupee}
          color="emerald"
          loading={summaryLoading}
        />
        <KPICard
          title="Dastak Commission"
          value={formatCurrency(summary?.dastak_commission)}
          icon={Percent}
          color="blue"
          loading={summaryLoading}
        />
        <KPICard
          title="Delivery Charges"
          value={formatCurrency(summary?.delivery_charges_collected)}
          icon={Bike}
          color="orange"
          loading={summaryLoading}
        />
        <KPICard
          title="Pending Settlements"
          value={formatCurrency(summary?.pending_settlements_amount)}
          icon={Clock}
          color="rose"
          loading={summaryLoading}
        />
      </div>

      {/* Secondary Finance Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Restaurant Payable:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {formatCurrency(summary?.restaurant_payable)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Delivery Boy Payouts:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {formatCurrency(summary?.delivery_boy_payouts)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">COD Cash Collected:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
            {formatCurrency(summary?.cod_collected)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Online UPI / Card:</span>
          <span className="font-bold text-[#113BD0] dark:text-blue-400 text-sm">
            {formatCurrency(summary?.online_payments)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Restaurant Settlements */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="w-full sm:w-56">
            <CustomSelect
              value={cycleFilter}
              onChange={setCycleFilter}
              options={[
                { value: 'ALL', label: 'All Settlement Cycles' },
                { value: 'DAILY', label: 'Daily Settlements' },
                { value: 'WEEKLY', label: 'Weekly Settlements' },
                { value: 'MONTHLY', label: 'Monthly Settlements' },
              ]}
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={settlementColumns}
              data={settlements || []}
              loading={settleLoading}
              emptyTitle="No settlements pending"
            />
          </div>

          {/* Mobile Settlement Cards */}
          <div className="md:hidden space-y-2.5">
            {settleLoading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Loading settlements...</p>
              </div>
            ) : !settlements || settlements.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
                No settlements pending.
              </div>
            ) : (
              settlements.map((settle) => (
                <div
                  key={settle.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5 text-xs"
                >
                  {/* Header: ID, Restaurant & Status */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#113BD0] dark:text-blue-400">
                        <span>#{settle.id}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-sans truncate">
                          &bull; {settle.restaurant_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {settle.period} &bull; {settle.orders_count} Orders
                      </span>
                    </div>
                    <StatusBadge status={settle.status} size="xs" />
                  </div>

                  {/* Financial Breakdown Strip */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gross</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {formatCurrency(settle.gross_sales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Comm (-)</span>
                      <span className="font-semibold text-[#113BD0] dark:text-blue-400 text-xs">
                        -{formatCurrency(settle.commission_deducted)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Pay</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(settle.payable_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cycle: {settle.settlement_cycle}
                    </span>

                    {settle.status === 'PENDING' ? (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setSettleModalItem(settle)}
                        className="h-10 sm:h-8 px-4 text-xs font-bold"
                      >
                        Process Pay
                      </Button>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Commissions */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          {/* Important Rule Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-sm">Historical Data Protection Rule</h5>
              <p className="mt-0.5 leading-relaxed">
                Changing a restaurant's commission percentage will apply strictly to <strong>future orders only</strong>. Past orders and existing settlement records will remain unchanged to preserve financial ledger integrity.
              </p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={commissionColumns}
              data={commissions || []}
              loading={commLoading}
              emptyTitle="No commission rules configured"
            />
          </div>

          {/* Mobile Commission Cards */}
          <div className="md:hidden space-y-2.5">
            {commLoading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Loading commissions...</p>
              </div>
            ) : !commissions || commissions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
                No commission rules configured.
              </div>
            ) : (
              commissions.map((comm) => (
                <div
                  key={comm.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{comm.restaurant_name}</h4>
                    <StatusBadge status={comm.status} size="xs" />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Commission</span>
                      <span className="text-base font-black text-[#113BD0] dark:text-blue-400">{comm.commission}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Effective Date</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatDate(comm.effective_from)}</span>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => {
                          setEditingCommissionRest(comm)
                          setNewCommissionRate(String(comm.commission))
                        }}
                        className="h-10 sm:h-8 text-xs"
                      >
                        Change %
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Charge Rules */}
      {activeTab === 'delivery_rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Visual Delivery Pricing Rules
            </h3>
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Add Rule Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliveryRules.map((rule) => (
              <div
                key={rule.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{rule.type}</h4>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {rule.min_km !== undefined ? `${rule.min_km} KM - ${rule.max_km} KM` : `Orders above ${formatCurrency(rule.min_order)}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#113BD0] dark:text-blue-400">
                    {rule.fee === 0 ? 'FREE' : formatCurrency(rule.fee)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Settlement Modal */}
      {settleModalItem && (
        <Modal
          isOpen={!!settleModalItem}
          onClose={() => setSettleModalItem(null)}
          title="Process Partner Settlement"
          subtitle={`Settling payout for ${settleModalItem.restaurant_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{settleModalItem.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{settleModalItem.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Sales:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(settleModalItem.gross_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commission Deducted:</span>
                <span className="font-bold text-[#113BD0]">-{formatCurrency(settleModalItem.commission_deducted)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-emerald-600 dark:text-emerald-400">
                <span>Total Payout Amount:</span>
                <span>{formatCurrency(settleModalItem.payable_amount)}</span>
              </div>
            </div>

            <Input
              label="Bank Transaction / UTR / Reference No."
              required
              placeholder="e.g. UTR1234567890"
              value={payoutRef}
              onChange={(e) => setPayoutRef(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSettleModalItem(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleProcessSettlement} loading={actionLoading}>
                Confirm Payout
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Commission Modal */}
      {editingCommissionRest && (
        <Modal
          isOpen={!!editingCommissionRest}
          onClose={() => setEditingCommissionRest(null)}
          title="Update Restaurant Commission"
          subtitle={`Modify platform commission for ${editingCommissionRest.restaurant_name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-xs text-[#113BD0] dark:text-blue-300 font-medium">
              Note: This will only affect new orders placed after this change.
            </div>

            <Input
              label="New Commission Percentage (%)"
              type="number"
              min="0"
              max="100"
              required
              value={newCommissionRate}
              onChange={(e) => setNewCommissionRate(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingCommissionRest(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveCommission} loading={actionLoading}>
                Update Commission
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default FinanceDashboard
