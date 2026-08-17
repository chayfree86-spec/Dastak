import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  Shield,
  Check,
  Calendar,
  Filter,
  Search,
  User,
  Store,
  MapPin,
  Phone,
  Receipt,
  Eye,
  Copy,
  ChevronRight,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react'
import deliveryApi from '../../api/delivery.api'
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters'
import { copyToClipboard, makePhoneCall } from '../../utils/geo'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'

export const CodCollectionPage = () => {
  const toast = useToast()

  // State
  const [collections, setCollections] = useState([])
  const [meta, setMeta] = useState({
    pending_cash_in_hand: 0,
    today_collected: 0,
    total_deposited: 0,
  })
  const [loading, setLoading] = useState(true)
  const [depositLoading, setDepositLoading] = useState(false)

  // Filters State
  const [datePreset, setDatePreset] = useState('all') // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'COLLECTED' | 'DEPOSITED_TO_OFFICE' | 'VERIFIED'
  const [searchQuery, setSearchQuery] = useState('')
  const [customDateModalOpen, setCustomDateModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  // Inspection Modal State
  const [selectedItem, setSelectedItem] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Fetch Ledger from API
  const fetchLedger = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        per_page: 50,
      }

      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      if (datePreset !== 'all' && datePreset !== 'custom') {
        params.preset = datePreset
      } else if (datePreset === 'custom' && dateRange.from) {
        params.date_from = dateRange.from
        if (dateRange.to) params.date_to = dateRange.to
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await deliveryApi.getCodLedger(params)
      const data = res.data?.data || []
      const responseMeta = res.data?.meta || {}

      setCollections(data)
      setMeta({
        pending_cash_in_hand: responseMeta.pending_cash_in_hand || 0,
        today_collected: responseMeta.today_collected || 0,
        total_deposited: responseMeta.total_deposited || 0,
      })
    } catch (e) {
      console.warn('Failed to load COD ledger:', e)
    } finally {
      setLoading(false)
    }
  }, [datePreset, statusFilter, searchQuery, dateRange])

  useEffect(() => {
    fetchLedger()
  }, [fetchLedger])

  // Filter in memory for instantaneous search by customer name/phone/item
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections
    const q = searchQuery.toLowerCase().trim()
    return collections.filter((c) => {
      const orderNum = (c.order_number || '').toLowerCase()
      const custName = (c.customer?.name || '').toLowerCase()
      const custPhone = (c.customer?.phone || '').toLowerCase()
      const restName = (c.restaurant?.name || '').toLowerCase()
      const itemsMatch = (c.items || []).some((it) =>
        (it.name || '').toLowerCase().includes(q)
      )
      return (
        orderNum.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        restName.includes(q) ||
        itemsMatch
      )
    })
  }, [collections, searchQuery])

  // Submit All Pending Cash to Office
  const handleDepositAll = async () => {
    const pendingItems = collections.filter((c) => c.status === 'COLLECTED')
    const collectedIds = pendingItems.map((c) => c.id)

    if (collectedIds.length === 0) {
      toast.info('No Pending Cash', 'All collected cash has already been submitted.')
      return
    }

    setDepositLoading(true)
    try {
      await deliveryApi.depositCod(collectedIds)
      toast.success(
        'Deposit Request Sent!',
        `Submitted ₹${meta.pending_cash_in_hand} deposit request. Please hand over the physical cash at the hub.`
      )
      fetchLedger()
    } catch (err) {
      toast.error('Deposit Failed', err.message || 'Unable to submit cash deposit request.')
    } finally {
      setDepositLoading(false)
    }
  }

  const handleCopyOrderNumber = async (num, id) => {
    const ok = await copyToClipboard(num)
    if (ok) {
      setCopiedId(id)
      toast.success('Copied', `#${num} copied to clipboard.`)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleApplyCustomDates = (e) => {
    e.preventDefault()
    if (!dateRange.from) {
      toast.error('Date Required', 'Please select at least a Start Date.')
      return
    }
    setDatePreset('custom')
    setCustomDateModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            COD Cash Ledger & Settlements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit cash collected on deliveries, customer order receipts, and office deposit status
          </p>
        </div>

        {meta.pending_cash_in_hand > 0 && (
          <Button
            variant="primary"
            size="md"
            icon={Building}
            loading={depositLoading}
            onClick={handleDepositAll}
            className="shadow-lg shadow-blue-600/25 text-xs font-black shrink-0"
          >
            Deposit Cash to Office ({formatCurrency(meta.pending_cash_in_hand)})
          </Button>
        )}
      </div>

      {/* 2. Top Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Cash in Hand (To Deposit) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-400/40 dark:border-amber-500/30 text-amber-950 dark:text-amber-100 flex items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
              CASH IN HAND (TO DEPOSIT)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-100">
              {formatCurrency(meta.pending_cash_in_hand)}
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 font-medium">
              Physical cash with rider
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Today's COD Collected */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-800/50 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              TODAY'S COD COLLECTED
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(meta.today_collected)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Collected from today's orders
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#2845D6] text-white flex items-center justify-center shadow-md shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Deposited to Hub */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/50 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              SUBMITTED TO HUB / OFFICE
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(meta.total_deposited)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Handed over to central office
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar Suite */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Row 1: Search Bar & Custom Date Trigger */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer Name, Phone or Dish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCustomDateModalOpen(true)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              datePreset === 'custom'
                ? 'bg-[#2845D6] text-white border-[#2845D6] shadow-md shadow-blue-600/20'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>
              {datePreset === 'custom' && dateRange.from
                ? `${dateRange.from} ${dateRange.to ? `to ${dateRange.to}` : ''}`
                : 'Custom Date Range'}
            </span>
          </button>
        </div>

        {/* Row 2: Filter Pills (Date Presets & Status) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-750 text-xs">
          {/* Date Preset Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDatePreset(p.id)
                  setDateRange({ from: '', to: '' })
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-[#2845D6] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'COLLECTED', label: 'Cash in Hand' },
              { id: 'DEPOSITED_TO_OFFICE', label: 'Submitted to Hub' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === s.id
                    ? s.id === 'COLLECTED'
                      ? 'bg-amber-500 text-white'
                      : s.id === 'DEPOSITED_TO_OFFICE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Detailed COD Collection Order Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          <span>
            COLLECTION ENTRIES ({filteredCollections.length} TRIPS)
          </span>
          {datePreset !== 'all' && (
            <span className="text-[#2845D6] dark:text-blue-400 font-bold lowercase">
              filtered by {datePreset}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No Collection Records Found"
            description="No COD collections match your selected date or search filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredCollections.map((item) => {
              const isDeposited =
                item.status === 'DEPOSITED_TO_OFFICE' || item.status === 'VERIFIED'
              const cust = item.customer || {}
              const rest = item.restaurant || {}
              const itemsList = item.items || []

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Top Bar: Order # & Status Badge & Timestamp */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-750 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopyOrderNumber(item.order_number, item.id)}
                        className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 hover:text-[#2845D6] dark:hover:text-blue-400"
                        title="Click to copy Order #"
                      >
                        <span>#{item.order_number}</span>
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                          isDeposited
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDeposited ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                          }`}
                        />
                        {item.status_label || item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Middle Content Grid: Customer, Restaurant, Food Items */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Column 1: Customer Details */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-[#F97316]" /> Customer Details
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {cust.name || 'Valued Customer'}
                      </h4>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-mono">{cust.phone}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {cust.address || 'Civil Lines, Kanpur'}
                      </p>
                    </div>

                    {/* Column 2: Restaurant Source */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#2845D6]" /> Kitchen Outlet
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {rest.name || 'Partner Kitchen'}
                      </h4>
                      {rest.phone && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-mono">{rest.phone}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {rest.address || 'Kanpur Main'}
                      </p>
                    </div>

                    {/* Column 3: Food Items Ordered */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-emerald-600" /> Ordered Items ({itemsList.length})
                      </span>
                      <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                        {itemsList.length > 0 ? (
                          itemsList.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300"
                            >
                              <span className="font-medium truncate pr-1">
                                {it.quantity}x {it.name}
                              </span>
                              <span className="font-mono font-bold shrink-0">
                                {formatCurrency(it.total_price || it.unit_price)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Items summary recorded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Bar: Cash Amount & Inspect Button */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">
                          COD CASH AMOUNT
                        </span>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDeposited ? (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline-block">
                          ✓ Deposited {item.deposited_at ? formatTime(item.deposited_at) : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hidden sm:inline-block">
                          Pending office deposit
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2845D6] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2845D6]" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Custom Date Range Picker Modal */}
      <Modal
        isOpen={customDateModalOpen}
        onClose={() => setCustomDateModalOpen(false)}
        title="Custom Date Filter"
        subtitle="Filter COD collections by date range"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleApplyCustomDates} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Start Date (From)
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-[#2845D6] focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              End Date (To)
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-[#2845D6] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomDateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Apply Date Filter
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. COD Order Receipt Detail Inspection Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`Order #${selectedItem.order_number}`}
          subtitle="Cash on Delivery Collection Audit"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            {/* Status & Total Amount Box */}
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-950 dark:text-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 block">
                  CASH COLLECTED
                </span>
                <div className="text-2xl font-black">{formatCurrency(selectedItem.amount)}</div>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border inline-block ${
                    selectedItem.status === 'DEPOSITED_TO_OFFICE' ||
                    selectedItem.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {selectedItem.status_label || selectedItem.status}
                </span>
              </div>
            </div>

            {/* Customer & Kitchen Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#F97316]" /> Customer
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedItem.customer?.name}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {selectedItem.customer?.address}
                </p>
                {selectedItem.customer?.phone && (
                  <button
                    type="button"
                    onClick={() => makePhoneCall(selectedItem.customer?.phone)}
                    className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-1"
                  >
                    <Phone className="w-3 h-3" /> {selectedItem.customer?.phone}
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                  <Store className="w-3 h-3 text-[#2845D6]" /> Kitchen Outlet
                </span>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedItem.restaurant?.name}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {selectedItem.restaurant?.address || 'Civil Lines'}
                </p>
                {selectedItem.restaurant?.phone && (
                  <button
                    type="button"
                    onClick={() => makePhoneCall(selectedItem.restaurant?.phone)}
                    className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-1"
                  >
                    <Phone className="w-3 h-3" /> {selectedItem.restaurant?.phone}
                  </button>
                )}
              </div>
            </div>

            {/* Itemized Food Bill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                ITEMIZED ORDER RECEIPT
              </span>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {(selectedItem.items || []).map((it, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-mono font-bold">
                      {formatCurrency(it.total_price || it.unit_price)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedItem.bill && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedItem.bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(selectedItem.bill.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{formatCurrency(selectedItem.bill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 dark:text-slate-100 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Cash Collected</span>
                    <span>{formatCurrency(selectedItem.bill.total_amount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Audit */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div>• Collected at: {formatDateTime(selectedItem.created_at)}</div>
              {selectedItem.deposited_at && (
                <div>• Deposited to Office: {formatDateTime(selectedItem.deposited_at)}</div>
              )}
              {selectedItem.verified_by && (
                <div>• Verified by: {selectedItem.verified_by}</div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CodCollectionPage
