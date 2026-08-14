import React, { useState } from 'react'
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

  const { data, loading, error, retry } = useApi(
    () => reportsApi.getReportData(reportType, { range: dateRange }),
    [reportType, dateRange],
    {
      initialData: [
        { date: '2026-02-08', total_orders: 142, gross_sales: 68450.00, dastak_commission: 10267.50, cod_amount: 24800.00, cancelled_orders: 4 },
        { date: '2026-02-07', total_orders: 135, gross_sales: 62100.00, dastak_commission: 9315.00, cod_amount: 21500.00, cancelled_orders: 2 },
        { date: '2026-02-06', total_orders: 158, gross_sales: 74200.00, dastak_commission: 11130.00, cod_amount: 28900.00, cancelled_orders: 5 },
        { date: '2026-02-05', total_orders: 120, gross_sales: 58900.00, dastak_commission: 8835.00, cod_amount: 19400.00, cancelled_orders: 3 },
        { date: '2026-02-04', total_orders: 148, gross_sales: 71300.00, dastak_commission: 10695.00, cod_amount: 25100.00, cancelled_orders: 1 },
      ],
    }
  )

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Analytics & Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export real operational data for accounting, tax filings, and performance analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            loading={exportLoading}
          >
            Export to CSV
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={reportType} onChange={setReportType} />

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Select Timeline:</span>
        </div>

        <div className="w-full sm:w-56">
          <CustomSelect
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: 'TODAY', label: 'Today' },
              { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { value: 'THIS_MONTH', label: 'This Month (Feb 2026)' },
              { value: 'LAST_MONTH', label: 'Last Month (Jan 2026)' },
            ]}
          />
        </div>
      </div>

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
  )
}

export default ReportsDashboard
