import React, { useState } from 'react'
import { PlusCircle, Search, Tag, Calendar, Percent, RefreshCw, Trash2, Edit2, CheckCircle2 } from 'lucide-react'
import marketingApi from '../../api/marketing.api'
import { useApi } from '../../hooks/useApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Modal from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'

export const CouponList = () => {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form fields
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('20')
  const [minOrder, setMinOrder] = useState('299')
  const [maxDiscount, setMaxDiscount] = useState('100')
  const [startDate, setStartDate] = useState('2026-02-01')
  const [endDate, setEndDate] = useState('2026-03-31')
  const [usageLimit, setUsageLimit] = useState('500')
  const [userLimit, setUserLimit] = useState('1')
  const [isActive, setIsActive] = useState(true)

  const { data, loading, error, retry } = useApi(
    () => marketingApi.getCoupons({ search: search || undefined }),
    [search]
  )

  const handleOpenCreate = () => {
    setEditingCoupon(null)
    setCode('')
    setDiscountType('PERCENTAGE')
    setDiscountValue('20')
    setMinOrder('299')
    setMaxDiscount('100')
    setStartDate('2026-02-01')
    setEndDate('2026-03-31')
    setUsageLimit('500')
    setUserLimit('1')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleSaveCoupon = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.warning('Code Required', 'Please provide a coupon code.')
      return
    }

    setActionLoading(true)
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order: Number(minOrder),
        max_discount: Number(maxDiscount),
        start_date: startDate,
        end_date: endDate,
        usage_limit: Number(usageLimit),
        user_limit: Number(userLimit),
        is_active: isActive,
      }

      if (editingCoupon?.id) {
        await marketingApi.updateCoupon(editingCoupon.id, payload)
        toast.success('Coupon Updated', `Coupon ${code} updated successfully.`)
      } else {
        await marketingApi.createCoupon(payload)
        toast.success('Coupon Created', `Coupon ${code} created successfully.`)
      }

      setIsModalOpen(false)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save coupon.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      key: 'code',
      header: 'Coupon Code',
      render: (row) => (
        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[#F97316] border border-orange-200 dark:border-orange-900/50 inline-block">
          {row.code}
        </span>
      ),
    },
    {
      key: 'discount_value',
      header: 'Discount Offer',
      render: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {row.discount_type === 'PERCENTAGE' ? `${row.discount_value}% OFF` : `₹ ${row.discount_value} FLAT`}
        </span>
      ),
    },
    {
      key: 'min_order',
      header: 'Min Order',
      render: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">{formatCurrency(row.min_order)}</span>,
    },
    {
      key: 'max_discount',
      header: 'Max Cap',
      render: (row) => <span className="font-medium text-slate-600 dark:text-slate-400">{formatCurrency(row.max_discount)}</span>,
    },
    {
      key: 'validity',
      header: 'Validity Period',
      render: (row) => (
        <span className="text-[11px] text-slate-400">
          {formatDate(row.start_date)} - {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage / Cap',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.used_count || 0} / {row.usage_limit}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => <StatusBadge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="xs" />,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Coupons & Marketing Campaigns
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure discount promo codes, usage caps, and minimum order rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={handleOpenCreate}>
            Create Coupon
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons by promo code..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]/30 focus:border-[#2845D6]"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No coupons created"
        emptyDescription="Create your first promotional discount coupon to boost customer orders."
      />

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create Promotional Coupon'}
        subtitle="Configure discount structure, validity window, and usage limits."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Coupon Promo Code"
              required
              placeholder="e.g. SUMMER50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />

            <CustomSelect
              label="Discount Type"
              value={discountType}
              onChange={setDiscountType}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%) Off' },
                { value: 'FLAT', label: 'Flat Amount (₹) Off' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount (₹)'}
              type="number"
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
            <AmountInput
              label="Min Order (₹)"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
            <AmountInput
              label="Max Discount Cap (₹)"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Usage Limit"
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
            <Input
              label="Per User Limit"
              type="number"
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Activate Coupon Immediately"
              description="Make visible and redeemable by customers in checkout"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Save Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CouponList
