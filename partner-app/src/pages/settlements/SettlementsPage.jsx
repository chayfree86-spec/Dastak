import React from 'react'
import { Wallet, CheckCircle, Clock, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import reportsApi from '../../api/reports.api'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

export const SettlementsPage = () => {
  const { data: settlementsData, loading, error, retry } = useApi(
    () => reportsApi.getSettlements({ per_page: 30 }),
    []
  )

  const settlements = settlementsData?.data || settlementsData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#2845D6]" />
            <span>Bank Settlements & Payouts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Track bank payout transfers, settlement reference numbers, and payout cycles.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => retry()}>
          Refresh
        </Button>
      </div>

      {loading && <LoadingSkeleton count={3} />}
      {error && <ErrorState title="Unable to load settlements" message={error} onRetry={() => retry()} />}

      {!loading && !error && settlements.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No Settlement Records Yet"
          description="Your completed order earnings will be grouped into scheduled payout cycles and transferred to your bank account."
          className="py-16"
        />
      )}

      {/* Settlements List */}
      <div className="space-y-3">
        {settlements.map((item) => {
          const isPaid = item.status === 'PAID' || item.status === 'SETTLED'
          return (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {isPaid ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      Settlement #{item.settlement_number || item.id}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Period: <strong>{item.start_date || 'N/A'}</strong> to{' '}
                    <strong>{item.end_date || 'N/A'}</strong>
                  </p>
                  {item.transaction_reference && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      UTR / Bank Ref: {item.transaction_reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto border-slate-100 font-mono">
                <span className="text-xs text-slate-400 font-sans block">Net Payout Transferred</span>
                <span className="text-xl font-black text-slate-900 block">
                  {formatCurrency(item.net_payout_amount || item.amount)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Gross: {formatCurrency(item.gross_sales)} | Fee: {formatCurrency(item.commission_deducted)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SettlementsPage
