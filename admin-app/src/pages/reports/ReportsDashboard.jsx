import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  ShoppingBag,
  IndianRupee,
  Store,
  Bike,
  Percent,
  Wallet,
} from 'lucide-react'
import reportsApi from '../../api/reports.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import Tabs from '../../components/common/Tabs'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import CustomSelect from '../../components/common/CustomSelect'
import { useToast } from '../../context/ToastContext'

export const ReportsDashboard = () => {
  const toast = useToast()
  const [reportType, setReportType] = useState('orders')
  const [dateRange, setDateRange] = useState('LAST_7_DAYS')
  const [exportLoading, setExportLoading] = useState(false)

  const { data, loading, error, retry, silentRefresh } = useApi(
    () => reportsApi.getReportData(reportType, { range: dateRange }),
    [reportType, dateRange]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 15000)
    return () => clearInterval(interval)
  }, [silentRefresh])

  const handleExportCsv = () => {
    setExportLoading(true)
    setTimeout(() => {
      // Create CSV blob from real data
      if (!data || data.length === 0) {
        toast.warning('No Data', 'No records available to export.')
        setExportLoading(false)
        return
      }

      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((row) => Object.values(row).join(',')).join('\n')
      const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `Dastak_${reportType}_report_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export Complete', 'CSV report downloaded successfully.')
      setExportLoading(false)
    }, 500)
  }

  const tabs = [
    { id: 'orders', label: 'Orders & Sales Report', icon: ShoppingBag },
    { id: 'commission', label: 'Commission Revenue Report', icon: Percent },
    { id: 'cod', label: 'COD Cash Collection Report', icon: Wallet },
  ]

  const columns = [
    {
      key: 'date',
      header: 'Report Date',
      render: (row) => <span className="font-bold text-slate-900 dark:text-slate-100">{formatDate(row.date)}</span>,
    },
    {
      key: 'total_orders',
      header: 'Completed Orders',
      align: 'center',
      render: (row) => <span className="font-bold">{row.total_orders}</span>,
    },
    {
      key: 'gross_sales',
      header: 'Gross Sales',
      align: 'right',
      render: (row) => <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(row.gross_sales)}</span>,
    },
    {
      key: 'dastak_commission',
      header: 'Dastak Commission',
      align: 'right',
      render: (row) => <span className="font-black text-[#2845D6] dark:text-blue-400">{formatCurrency(row.dastak_commission)}</span>,
    },
    {
      key: 'cod_amount',
      header: 'COD Collected',
      align: 'right',
      render: (row) => <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(row.cod_amount)}</span>,
    },
    {
      key: 'cancelled_orders',
      header: 'Cancellations',
      align: 'center',
      render: (row) => (
        <span className={row.cancelled_orders > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
          {row.cancelled_orders}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export operational reports, commission revenue & tax filings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={Download}
            onClick={handleExportCsv}
            loading={exportLoading}
            className="h-11 sm:h-9 text-xs font-bold w-full sm:w-auto"
          >
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={reportType} onChange={setReportType} />

      {/* Timeline Filter */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Select Timeline:</span>
        </div>

        <div className="w-full sm:w-56">
          <CustomSelect
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: 'TODAY', label: 'Today' },
              { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { value: 'THIS_MONTH', label: 'This Month' },
              { value: 'LAST_MONTH', label: 'Last Month' },
            ]}
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data || []}
          loading={loading}
          error={error}
          onRetry={retry}
          emptyTitle="No report data"
          emptyDescription="No transaction records match the specified date range."
        />
      </div>

      {/* Mobile Report Cards */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2845D6] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading report metrics...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No transaction records found for this timeline.
          </div>
        ) : (
          data.map((row, idx) => (
            <div
              key={row.date || idx}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5 text-xs"
            >
              {/* Header: Date & Orders Completed */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {formatDate(row.date)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#2845D6] dark:text-blue-400 font-bold text-[11px]">
                    {row.total_orders} Orders
                  </span>
                  {row.cancelled_orders > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-semibold text-[10px]">
                      {row.cancelled_orders} Cancel
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Gross Sales</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                    {formatCurrency(row.gross_sales)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Commission</span>
                  <span className="font-black text-[#2845D6] dark:text-blue-400 text-xs">
                    {formatCurrency(row.dastak_commission)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">COD Collected</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                    {formatCurrency(row.cod_amount)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReportsDashboard
