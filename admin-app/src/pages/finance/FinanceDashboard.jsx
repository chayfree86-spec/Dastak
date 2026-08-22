import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import financeApi from '../../api/finance.api'
import settingsApi from '../../api/settings.api'
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
import ConfirmDialog from '../../components/common/ConfirmDialog'
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

  // Delivery Rules & Tiers State
  const [deliverySettings, setDeliverySettings] = useState(null)
  const [loadingDeliverySettings, setLoadingDeliverySettings] = useState(false)
  const [tierModal, setTierModal] = useState(null) // null | { index?: number, up_to_km: string, free_above: string, fee: string }
  const [deleteTierIndex, setDeleteTierIndex] = useState(null)
  const [savingTier, setSavingTier] = useState(false)

  const { data: summary, loading: summaryLoading, retry: retrySummary } = useApi(
    () => financeApi.getFinanceSummary()
  )

  const { data: settlements, loading: settleLoading, retry: retrySettlements } = useApi(
    () => financeApi.getSettlements({ cycle: cycleFilter !== 'ALL' ? cycleFilter : undefined }),
    [cycleFilter]
  )

  const { data: commissions, loading: commLoading, retry: retryCommissions } = useApi(
    () => financeApi.getRestaurantCommissions()
  )

  const fetchDeliverySettings = useCallback(async () => {
    setLoadingDeliverySettings(true)
    try {
      const res = await settingsApi.getDeliverySettings()
      const data = res?.data || res || {}
      setDeliverySettings(data)
    } catch (err) {
      console.error('Failed to load delivery settings:', err)
    } finally {
      setLoadingDeliverySettings(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'delivery_rules') {
      fetchDeliverySettings()
    }
  }, [activeTab, fetchDeliverySettings])

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

  const handleSaveTier = async (tierData) => {
    setSavingTier(true)
    try {
      const currentTiers = Array.isArray(deliverySettings?.delivery_tiers)
        ? [...deliverySettings.delivery_tiers]
        : []

      const newTierObj = {
        up_to_km: Number(tierData.up_to_km) || 0,
        free_above: Number(tierData.free_above) || 0,
        fee: Number(tierData.fee) || 0,
      }

      if (tierData.index !== undefined && tierData.index >= 0) {
        currentTiers[tierData.index] = newTierObj
      } else {
        currentTiers.push(newTierObj)
      }

      // Sort tiers ascending by up_to_km
      const sortedTiers = currentTiers
        .filter((t) => t.up_to_km > 0)
        .sort((a, b) => a.up_to_km - b.up_to_km)

      await settingsApi.updateDeliverySettings({
        delivery_tiers: sortedTiers,
      })

      toast.success(
        tierData.index !== undefined ? 'Tier Updated' : 'Tier Created',
        'Distance-based pricing tier saved to platform engine.'
      )
      setTierModal(null)
      fetchDeliverySettings()
    } catch (err) {
      toast.error('Failed to save tier', err.message || 'Unable to update delivery tiers.')
    } finally {
      setSavingTier(false)
    }
  }

  const handleDeleteTier = async () => {
    if (deleteTierIndex === null) return
    setSavingTier(true)
    try {
      const currentTiers = Array.isArray(deliverySettings?.delivery_tiers)
        ? [...deliverySettings.delivery_tiers]
        : []

      const filtered = currentTiers.filter((_, idx) => idx !== deleteTierIndex)

      await settingsApi.updateDeliverySettings({
        delivery_tiers: filtered,
      })

      toast.success('Tier Removed', 'Pricing tier deleted from system.')
      setDeleteTierIndex(null)
      fetchDeliverySettings()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to delete tier.')
    } finally {
      setSavingTier(false)
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
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.restaurant_name}</span>,
    },
    {
      key: 'period',
      header: 'Cycle / Period',
      render: (row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.period}</span>,
    },
    {
      key: 'gross_sales',
      header: 'Gross Sales',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.gross_sales)}</span>,
    },
    {
      key: 'commission_deducted',
      header: 'Commission',
      render: (row) => (
        <span className="font-semibold text-[#113BD0] dark:text-blue-400">
          -{formatCurrency(row.commission_deducted)}
        </span>
      ),
    },
    {
      key: 'payable_amount',
      header: 'Net Payable',
      render: (row) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.payable_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Button
            variant="primary"
            size="xs"
            onClick={() => setSettleModalItem(row)}
            className="font-bold"
          >
            Settle Payout
          </Button>
        ) : (
          <span className="text-xs text-slate-400 font-mono">Paid: {row.payout_reference || 'N/A'}</span>
        ),
    },
  ]

  const commissionColumns = [
    {
      key: 'restaurant_name',
      header: 'Restaurant Partner',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">{row.restaurant_name}</span>
          <span className="text-[10px] text-slate-400">ID: #{row.id}</span>
        </div>
      ),
    },
    {
      key: 'commission',
      header: 'Commission %',
      render: (row) => (
        <span className="font-black text-sm text-[#113BD0] dark:text-blue-400">
          {row.commission}%
        </span>
      ),
    },
    {
      key: 'effective_from',
      header: 'Effective Date',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.effective_from)}</span>,
    },
    {
      key: 'status',
      header: 'Agreement Status',
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Edit',
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            setEditingCommissionRest(row)
            setNewCommissionRate(String(row.commission))
          }}
        >
          Modify %
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Operations & Settlements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time ledger, partner revenue payouts, commission matrix, and delivery pricing rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              retrySummary()
              retrySettlements()
              retryCommissions()
              if (activeTab === 'delivery_rules') fetchDeliverySettings()
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Gross Volume"
          value={formatCurrency(summary?.gross_sales || 0)}
          subtitle="All platform orders to date"
          icon={Wallet}
          loading={summaryLoading}
        />
        <KPICard
          title="Net Platform Revenue"
          value={formatCurrency(summary?.net_revenue || 0)}
          subtitle="Commissions & platform fees"
          icon={TrendingUp}
          loading={summaryLoading}
        />
        <KPICard
          title="Pending Merchant Payouts"
          value={formatCurrency(summary?.pending_payouts || 0)}
          subtitle="Awaiting bank transfer"
          icon={Store}
          loading={summaryLoading}
        />
        <KPICard
          title="Cash Collected (COD)"
          value={formatCurrency(summary?.cod_collected || 0)}
          subtitle="In rider hands / settled"
          icon={IndianRupee}
          loading={summaryLoading}
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Restaurant Settlements */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Partner Settlement Ledger
            </h3>
            <div className="flex items-center gap-2">
              <CustomSelect
                value={cycleFilter}
                onChange={setCycleFilter}
                options={[
                  { value: 'ALL', label: 'All Billing Cycles' },
                  { value: 'WEEKLY', label: 'Weekly Settlement' },
                  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
                  { value: 'MONTHLY', label: 'Monthly' },
                ]}
                className="w-44 text-xs"
              />
            </div>
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={settlementColumns}
              data={settlements || []}
              loading={settleLoading}
              emptyMessage="No partner settlements found for this cycle."
            />
          </div>

          <div className="md:hidden space-y-3">
            {settleLoading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 font-medium">Loading settlements...</p>
              </div>
            ) : !settlements || settlements.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
                No partner settlements found.
              </div>
            ) : (
              settlements.map((settle) => (
                <div
                  key={settle.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#113BD0] dark:text-blue-400 block text-xs">
                        #{settle.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                        {settle.restaurant_name}
                      </h4>
                    </div>
                    <StatusBadge status={settle.status} size="xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Gross Sales</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(settle.gross_sales)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Commission</span>
                      <span className="font-bold text-[#113BD0]">-{formatCurrency(settle.commission_deducted)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Cycle</span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{settle.period}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Payable</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(settle.payable_amount)}</span>
                    </div>
                  </div>

                  {settle.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setSettleModalItem(settle)}
                        className="w-full h-10 text-xs font-black"
                      >
                        Process Payout
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Commission Rates */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Merchant Commission Agreements
            </h3>
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={commissionColumns}
              data={commissions || []}
              loading={commLoading}
              emptyMessage="No commission rules configured."
            />
          </div>

          <div className="md:hidden space-y-3">
            {commLoading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
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
                        size="sm"
                        onClick={() => {
                          setEditingCommissionRest(comm)
                          setNewCommissionRate(String(comm.commission))
                        }}
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

      {/* Tab 3: Delivery Charge Rules & Interactive Tiers */}
      {activeTab === 'delivery_rules' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Delivery Pricing & Distance Tiers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live delivery pricing rules applied to customer orders across distances.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to="/settings?tab=delivery"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-[#113BD0] dark:hover:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                <span>Fleet Settings</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                to="/settings?tab=delivery&action=add_tier"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 text-xs sm:text-sm font-black text-white bg-[#113BD0] hover:bg-[#0e30a8] rounded-2xl transition-all shadow-sm shadow-blue-500/20 active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Rule Tier</span>
              </Link>
            </div>
          </div>

          {/* Top Info Highlights */}
          {deliverySettings && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Festival Free Delivery
                </span>
                <span className={`text-sm font-black block ${deliverySettings.all_free_delivery ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  {deliverySettings.all_free_delivery ? '⚡ Active (₹0 For Everyone)' : 'Inactive'}
                </span>
                <p className="text-[11px] text-slate-400">Overrides all rules when enabled.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Standard Base Fee
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                  {formatCurrency(deliverySettings.base_delivery_fee || 35)} (up to {deliverySettings.base_delivery_distance_km || 3} km)
                </span>
                <p className="text-[11px] text-slate-400">
                  {deliverySettings.per_km_charge > 0 ? `+${formatCurrency(deliverySettings.per_km_charge)}/km beyond` : 'Flat rate only'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Free Threshold
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                  {Number(deliverySettings.free_delivery_min_order) > 0
                    ? `Free on Orders ≥ ${formatCurrency(deliverySettings.free_delivery_min_order)}`
                    : 'No global free threshold'}
                </span>
                <p className="text-[11px] text-slate-400">Simple free delivery threshold</p>
              </div>
            </div>
          )}

          {/* Distance Tiers Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#113BD0]" />
                <span>Configured Distance Tiers</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {Array.isArray(deliverySettings?.delivery_tiers) ? deliverySettings.delivery_tiers.length : 0} Active Tiers
              </span>
            </div>

            {loadingDeliverySettings ? (
              <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 font-medium">Loading pricing tiers...</p>
              </div>
            ) : !deliverySettings?.delivery_tiers || deliverySettings.delivery_tiers.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    No distance-based tiers configured
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Orders currently use Standard Base Charges above. Add distance tiers to customize pricing by kilometer bands.
                  </p>
                </div>
                <Link
                  to="/settings?tab=delivery&action=add_tier"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#113BD0] hover:bg-[#0e30a8] rounded-xl transition-all shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Your First Tier in Settings</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {deliverySettings.delivery_tiers.map((tier, idx) => {
                  const fromKm = idx === 0 ? 0 : (Number(deliverySettings.delivery_tiers[idx - 1].up_to_km) || 0)
                  const isFree = Number(tier.fee) === 0
                  const freeAbove = Number(tier.free_above) || 0

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-black text-[#113BD0] dark:text-blue-400 mb-1.5">
                            {fromKm} km – {tier.up_to_km} km
                          </div>
                          <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                            Distance Band #{idx + 1}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {freeAbove > 0
                              ? `Free for orders above ${formatCurrency(freeAbove)}`
                              : 'Standard tier pricing applies'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-black ${isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#113BD0] dark:text-blue-400'}`}>
                            {isFree ? 'FREE' : formatCurrency(tier.fee)}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">
                            Fee
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() =>
                            setTierModal({
                              index: idx,
                              up_to_km: String(tier.up_to_km),
                              free_above: String(tier.free_above || ''),
                              fee: String(tier.fee),
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#113BD0] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Edit Tier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTierIndex(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rule Tier Add / Edit Modal */}
      {tierModal && (
        <TierModal
          tier={tierModal}
          onClose={() => setTierModal(null)}
          onSave={handleSaveTier}
          loading={savingTier}
        />
      )}

      {/* Delete Tier Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTierIndex !== null}
        onClose={() => setDeleteTierIndex(null)}
        onConfirm={handleDeleteTier}
        loading={savingTier}
        type="danger"
        title="Delete Pricing Tier?"
        message={`Remove Distance Tier #${(deleteTierIndex ?? 0) + 1}? Deliveries in this distance band will fall back to standard pricing.`}
        confirmText="Yes, Delete Tier"
      />

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

const TierModal = ({ tier, onClose, onSave, loading }) => {
  const isEdit = tier?.index !== undefined
  const [upToKm, setUpToKm] = useState(tier?.up_to_km || '')
  const [freeAbove, setFreeAbove] = useState(tier?.free_above || '')
  const [fee, setFee] = useState(tier?.fee || '')

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!upToKm || Number(upToKm) <= 0) {
      return
    }
    onSave({
      index: tier?.index,
      up_to_km: upToKm,
      free_above: freeAbove,
      fee: fee === '' ? '0' : fee,
    })
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit Distance Tier #${tier.index + 1}` : 'Add Distance Pricing Tier'}
      subtitle="Define delivery fee and free order value threshold for this kilometer band."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Up to Distance (KM)"
            type="number"
            min="0.5"
            step="0.5"
            required
            placeholder="e.g. 2, 5, 10"
            value={upToKm}
            onChange={(e) => setUpToKm(e.target.value)}
            helperText="Maximum distance for this pricing band (e.g. 3 = up to 3 KM)."
          />
        </div>

        <div>
          <AmountInput
            label="Free Delivery Above Subtotal (₹)"
            placeholder="e.g. 199 or 499 (0 = never free in this band)"
            value={freeAbove}
            onChange={(e) => setFreeAbove(e.target.value)}
            helperText="Customer pays ₹0 delivery if order subtotal is at or above this amount."
          />
        </div>

        <div>
          <AmountInput
            label="Delivery Fee (₹)"
            required
            placeholder="e.g. 20 or 35 (0 = free delivery)"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            helperText="Standard delivery fee charged when order is below free threshold."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update Tier' : 'Save Rule Tier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FinanceDashboard
