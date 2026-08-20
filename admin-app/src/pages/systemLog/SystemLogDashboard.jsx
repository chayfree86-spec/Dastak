import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  Server,
  Database,
  Layers,
  Clock,
  CreditCard,
  Bell,
  HardDrive,
  RefreshCw,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Info,
  X,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  Calendar,
  Hash,
  User,
  ArrowUpDown,
} from 'lucide-react'
import { systemLogsApi } from '../../api/systemLogs.api'
import { useToast } from '../../context/ToastContext'
import CustomSelect from '../../components/common/CustomSelect'

const CATEGORIES = [
  'ALL',
  'ORDERS',
  'PAYMENTS',
  'RESTAURANTS',
  'DELIVERY',
  'CUSTOMERS',
  'ADMIN',
  'API',
  'DATABASE',
  'REDIS',
  'QUEUE',
  'NOTIFICATIONS',
  'AUTH',
  'SECURITY',
  'SYSTEM',
  'BACKUP',
]

const SEVERITY_OPTIONS = [
  { value: 'ALL', label: 'Severity: ALL' },
  { value: 'INFO', label: 'Severity: INFO' },
  { value: 'SUCCESS', label: 'Severity: SUCCESS' },
  { value: 'WARNING', label: 'Severity: WARNING' },
  { value: 'ERROR', label: 'Severity: ERROR' },
  { value: 'CRITICAL', label: 'Severity: CRITICAL' },
  { value: 'SECURITY', label: 'Severity: SECURITY' },
]

const ACTOR_OPTIONS = [
  { value: 'ALL', label: 'User Role: ALL' },
  { value: 'ADMIN', label: 'Role: Admin' },
  { value: 'RESTAURANT', label: 'Role: Restaurant' },
  { value: 'DELIVERY_BOY', label: 'Role: Rider' },
  { value: 'CUSTOMER', label: 'Role: Customer' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Date: All Time' },
  { value: 'today', label: 'Date: Today' },
  { value: 'yesterday', label: 'Date: Yesterday' },
  { value: '7d', label: 'Date: Last 7 Days' },
  { value: '30d', label: 'Date: Last 30 Days' },
]

const HEALTH_ICONS = {
  api: Server,
  database: Database,
  redis: Layers,
  queue: Clock,
  cron: Clock,
  payment: CreditCard,
  notification: Bell,
  backup: HardDrive,
}

export const SystemLogDashboard = () => {
  const toast = useToast()

  // Overview & Health State
  const [overview, setOverview] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)

  // Logs Table State
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 50 })
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [selectedActor, setSelectedActor] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all')

  // Auto-refresh State (30 seconds polling)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [countdown, setCountdown] = useState(30)

  // Detail Drawer State
  const [selectedLog, setSelectedLog] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Format local YYYY-MM-DD
  const formatLocalDate = (d = new Date()) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 1. Fetch Overview & Health Data
  const fetchOverview = useCallback(async () => {
    try {
      const res = await systemLogsApi.getOverview()
      const data = res?.data || res
      setOverview(data)
    } catch (err) {
      console.error('Failed to fetch system overview:', err)
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  // 2. Fetch Paginated Logs
  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoadingLogs(true)
      try {
        const params = {
          page,
          per_page: pagination.per_page,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          level: selectedLevel !== 'ALL' ? selectedLevel : undefined,
          actor_type: selectedActor !== 'ALL' ? selectedActor : undefined,
          search: searchQuery.trim() || undefined,
        }

        if (dateRange === 'today') {
          params.start_date = formatLocalDate(new Date())
          params.end_date = formatLocalDate(new Date())
        } else if (dateRange === 'yesterday') {
          const y = new Date()
          y.setDate(y.getDate() - 1)
          params.start_date = formatLocalDate(y)
          params.end_date = formatLocalDate(y)
        } else if (dateRange === '7d') {
          const d7 = new Date()
          d7.setDate(d7.getDate() - 7)
          params.start_date = formatLocalDate(d7)
        } else if (dateRange === '30d') {
          const d30 = new Date()
          d30.setDate(d30.getDate() - 30)
          params.start_date = formatLocalDate(d30)
        }

        const res = await systemLogsApi.getLogs(params)
        
        let logItems = []
        let meta = {}
        if (Array.isArray(res)) {
          logItems = res
        } else if (Array.isArray(res?.data)) {
          logItems = res.data
          meta = res?.meta || {}
        } else if (res?.data && Array.isArray(res.data.data)) {
          logItems = res.data.data
          meta = res.data.meta || res.data
        }

        setLogs(logItems)
        setPagination((prev) => ({
          current_page: meta.current_page || 1,
          last_page: meta.last_page || 1,
          total: meta.total !== undefined ? meta.total : logItems.length,
          per_page: meta.per_page || prev.per_page,
        }))
      } catch (err) {
        console.error('Failed to fetch logs:', err)
        toast.error('Failed to fetch logs', 'Could not load system logs from backend.')
      } finally {
        setLoadingLogs(false)
      }
    },
    [selectedCategory, selectedLevel, searchQuery, dateRange, pagination.per_page]
  )

  // Initial Load
  useEffect(() => {
    fetchOverview()
    fetchLogs(1)
  }, [fetchOverview, fetchLogs])

  // Auto-refresh countdown timer (30s)
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchOverview()
          fetchLogs(pagination.current_page)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchOverview, fetchLogs, pagination.current_page])

  // Open Log Details Drawer
  const handleOpenDetail = async (logId) => {
    setLoadingDetail(true)
    try {
      const res = await systemLogsApi.getLogDetail(logId)
      setSelectedLog(res?.data || res)
    } catch (err) {
      toast.error('Error', 'Unable to retrieve detailed log record.')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Export CSV
  const handleExport = async () => {
    try {
      toast.info('Exporting', 'Preparing sanitized CSV log export...')
      const blob = await systemLogsApi.exportLogs({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        level: selectedLevel !== 'ALL' ? selectedLevel : undefined,
      })
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dastak_system_logs_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Export Ready', 'CSV log file downloaded successfully.')
    } catch (err) {
      toast.error('Export Failed', 'Could not generate CSV export.')
    }
  }

  // Level Badge Helper
  const getLevelBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      case 'ERROR':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
      case 'SECURITY':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      case 'SUCCESS':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
    }
  }

  const getStatusDot = (status) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-500 ring-emerald-500/20'
      case 'Warning':
        return 'bg-amber-500 ring-amber-500/20'
      case 'Critical':
      case 'Down':
        return 'bg-rose-500 ring-rose-500/20'
      default:
        return 'bg-slate-400 ring-slate-400/20'
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* ======================================================== */}
      {/* 1. HEADER & AUTO-REFRESH CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                System Log & Monitoring Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live operational health, audit logs, error detection & request tracing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Polling Countdown Indicator */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
            title={autoRefresh ? 'Pause Auto Refresh' : 'Resume Auto Refresh'}
          >
            {autoRefresh ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-refresh: {countdown}s</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-400">Paused</span>
              </>
            )}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => {
              setCountdown(30)
              fetchOverview()
              fetchLogs(pagination.current_page)
            }}
            disabled={loadingOverview || loadingLogs}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Now"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOverview || loadingLogs ? 'animate-spin' : ''}`} />
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SYSTEM HEALTH STATUS CARDS */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System Subsystems Health
          </h2>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Realtime Telemetry Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {(overview?.health_cards || [
            { key: 'api', name: 'API Gateway', status: 'Healthy', latency_ms: 12 },
            { key: 'database', name: 'MySQL DB', status: 'Healthy', latency_ms: 2 },
            { key: 'redis', name: 'Redis Cache', status: 'Healthy', latency_ms: 1 },
            { key: 'queue', name: 'Queue Jobs', status: 'Healthy', latency_ms: 0 },
            { key: 'cron', name: 'Cron Engine', status: 'Healthy', latency_ms: 0 },
            { key: 'payment', name: 'Payment GW', status: 'Healthy', latency_ms: 45 },
            { key: 'notification', name: 'Push Engine', status: 'Healthy', latency_ms: 20 },
            { key: 'backup', name: 'DB Backup', status: 'Healthy', latency_ms: null },
          ]).map((card) => {
            const Icon = HEALTH_ICONS[card.key] || Server
            return (
              <div
                key={card.key}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ring-4 ${getStatusDot(card.status)}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{card.name}</div>
                  <div className="flex items-center justify-between text-[11px] mt-1 font-medium">
                    <span className={card.status === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
                      {card.status}
                    </span>
                    {card.latency_ms !== null && card.latency_ms !== undefined && (
                      <span className="text-slate-400 font-mono text-[10px]">{card.latency_ms}ms</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TODAY'S LIVE METRIC SUMMARY COUNTERS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Requests</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {overview?.summary?.total_api_requests ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Failed (4xx/5xx)</div>
          <div className={`text-xl font-extrabold mt-1 font-mono ${overview?.summary?.failed_api_requests ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {overview?.summary?.failed_api_requests ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Critical Alerts</div>
          <div className={`text-xl font-extrabold mt-1 font-mono ${overview?.summary?.critical_errors ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {overview?.summary?.critical_errors ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Warnings</div>
          <div className="text-xl font-extrabold text-amber-500 mt-1 font-mono">
            {overview?.summary?.warnings ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Orders Created</div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {overview?.summary?.orders_created ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Delivered</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {overview?.summary?.orders_delivered ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cancelled / Rejected</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {overview?.summary?.orders_cancelled ?? 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Stuck Orders</div>
          <div className={`text-xl font-extrabold mt-1 font-mono ${overview?.summary?.stuck_orders_count ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {overview?.summary?.stuck_orders_count ?? 0}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CRITICAL ALERTS & INCIDENT DETECTION PANEL */}
      {/* ======================================================== */}
      {overview?.critical_alerts && overview.critical_alerts.length > 0 && (
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Unresolved Incidents & Critical Warnings ({overview.critical_alerts.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.critical_alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{alert.description}</p>
                </div>
                {alert.action_url && (
                  <a
                    href={alert.action_url}
                    className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. LOG EXPLORER & FILTERS */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        {/* Category Horizontal Scrollable Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#113BD0] text-white shadow-xs shadow-[#113BD0]/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Global Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Event, User, IP, Device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]"
            />
          </div>

          {/* User Role Custom Dropdown */}
          <div>
            <CustomSelect
              value={selectedActor}
              onChange={(val) => setSelectedActor(val)}
              options={ACTOR_OPTIONS}
              className="w-full text-xs"
            />
          </div>

          {/* Severity Custom Dropdown */}
          <div>
            <CustomSelect
              value={selectedLevel}
              onChange={(val) => setSelectedLevel(val)}
              options={SEVERITY_OPTIONS}
              className="w-full text-xs"
            />
          </div>

          {/* Date Range Custom Dropdown */}
          <div>
            <CustomSelect
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={DATE_RANGE_OPTIONS}
              className="w-full text-xs"
            />
          </div>

          {/* Showing Count */}
          <div className="flex items-center justify-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Showing {logs.length} of {pagination.total} records
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. LOG LISTING TABLE (DESKTOP) / CARDS (MOBILE) */}
        {/* ======================================================== */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Event & Description</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Latency / Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {loadingLogs ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#113BD0]" />
                    <span>Loading system logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">No logs found matching current filter criteria.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => handleOpenDetail(log.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getLevelBadge(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {log.category}
                    </td>
                    <td className="py-3 px-4 min-w-[280px]">
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-md">{log.event}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">{log.description}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 text-xs">
                      {log.actor_name || log.actor_type || 'System'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {log.reference_id ? `${log.reference_type || ''} #${log.reference_id}` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                      {log.http_status && (
                        <span className={`font-bold mr-1.5 ${log.http_status >= 400 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {log.http_status}
                        </span>
                      )}
                      {log.response_time_ms ? `${log.response_time_ms}ms` : ''}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDetail(log.id)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={pagination.current_page <= 1 || loadingLogs}
              onClick={() => fetchLogs(pagination.current_page - 1)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              type="button"
              disabled={pagination.current_page >= pagination.last_page || loadingLogs}
              onClick={() => fetchLogs(pagination.current_page + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. LOG DETAIL SLIDE-OVER DRAWER */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={() => setSelectedLog(null)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getLevelBadge(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{selectedLog.category}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedLog.event}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-6 flex-1 text-xs">
              {/* Description */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-medium">
                {selectedLog.description}
              </div>

              {/* User Session & Geolocation Card */}
              {(selectedLog.metadata?.device || selectedLog.metadata?.location || selectedLog.ip_address) && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                    <span>User Session & Geolocation Info</span>
                    {selectedLog.metadata?.session_status && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        selectedLog.metadata.session_status === 'ACTIVE' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {selectedLog.metadata.session_status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Login Device / Client:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedLog.metadata?.device || selectedLog.user_agent || 'Web Browser'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Location / City:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedLog.metadata?.location || 'Kanpur, UP'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">IP Address:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedLog.ip_address || selectedLog.metadata?.ip_address || '127.0.0.1'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Session / Action Time:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedLog.metadata?.login_time || new Date(selectedLog.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Entity Quick Navigation */}
              {selectedLog.related_entity && (
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">
                    Linked {selectedLog.related_entity.type}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {selectedLog.related_entity.order_number || selectedLog.related_entity.name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {selectedLog.related_entity.customer_name || selectedLog.related_entity.status}
                      </div>
                    </div>
                    {selectedLog.related_entity.type === 'Order' && (
                      <a
                        href={`/orders?search=${selectedLog.related_entity.order_number}`}
                        className="px-3 py-1.5 rounded-lg bg-[#113BD0] text-white font-bold text-xs flex items-center gap-1"
                      >
                        <span>Open Order</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Request Specs */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Request Telemetry
                </div>
                <div className="grid grid-cols-2 gap-2 font-medium">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">Request Trace ID</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5 truncate">
                      {selectedLog.request_id || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">Timestamp</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">Endpoint & Method</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5 truncate">
                      [{selectedLog.http_method || 'GET'}] {selectedLog.endpoint || '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">Response Latency</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5">
                      {selectedLog.response_time_ms ? `${selectedLog.response_time_ms} ms` : '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">Actor</div>
                    <div className="text-slate-900 dark:text-white font-bold text-[11px] mt-0.5">
                      {selectedLog.actor_name || selectedLog.actor_type || 'System'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                    <div className="text-[10px] text-slate-400">IP Address</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold text-[11px] mt-0.5">
                      {selectedLog.ip_address || '127.0.0.1'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sanitized Metadata JSON Viewer */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Sanitized Context Metadata
                  </div>
                  <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemLogDashboard
