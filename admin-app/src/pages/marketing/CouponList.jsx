import React, { useState, useEffect, useRef } from 'react'
import { PlusCircle, Search, Tag, Calendar, Percent, Trash2, Edit2, CheckCircle2, Ban, AlertCircle, Upload, Image as ImageIcon, Flame, ArrowRight } from 'lucide-react'
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
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

export const CouponList = () => {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null)
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
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=70')
  const [isActive, setIsActive] = useState(true)

  const { data, loading, error, retry, silentRefresh } = useApi(
    () => marketingApi.getCoupons({ search: search || undefined }),
    [search]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      silentRefresh()
    }, 12000)
    return () => clearInterval(interval)
  }, [silentRefresh])

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
    setImageUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=70')
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon)
    setCode(coupon.code || '')
    setDiscountType(coupon.discount_type || 'PERCENTAGE')
    setDiscountValue(String(coupon.discount_value || ''))
    setMinOrder(String(coupon.min_order || ''))
    setMaxDiscount(String(coupon.max_discount || ''))
    setStartDate(coupon.start_date || '')
    setEndDate(coupon.end_date || '')
    setUsageLimit(String(coupon.usage_limit || ''))
    setUserLimit(String(coupon.user_limit || '1'))
    setImageUrl(coupon.image_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=70')
    setIsActive(Boolean(coupon.is_active))
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (coupon) => {
    setActionLoading(true)
    const newStatus = !coupon.is_active
    try {
      await marketingApi.toggleCouponStatus(coupon.id, newStatus)
      toast.success('Status Updated', `Coupon ${coupon.code} is now ${newStatus ? 'Active' : 'Inactive'}.`)
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCoupon = async () => {
    if (!deleteConfirmCoupon) return
    setActionLoading(true)
    try {
      await marketingApi.deleteCoupon(deleteConfirmCoupon.id)
      toast.success('Coupon Deleted', `Coupon ${deleteConfirmCoupon.code} has been deleted.`)
      setDeleteConfirmCoupon(null)
      if (isModalOpen) setIsModalOpen(false)
      retry()
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Unable to delete coupon.')
    } finally {
      setActionLoading(false)
    }
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
        image_url: imageUrl || undefined,
        is_active: isActive,
      }

      if (editingCoupon?.id) {
        await marketingApi.updateCoupon(editingCoupon.id, payload)
        toast.success('Coupon & Banner Updated', `Coupon ${code} updated successfully.`)
      } else {
        await marketingApi.createCoupon(payload)
        toast.success('Coupon & Banner Created', `Coupon ${code} created successfully.`)
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
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to toggle status"
        >
          <StatusBadge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} size="xs" />
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant={row.is_active ? 'outline' : 'success'}
            size="sm"
            icon={row.is_active ? Ban : CheckCircle2}
            onClick={() => handleToggleStatus(row)}
            title={row.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
            className="w-8 h-8 p-0 flex items-center justify-center"
          />
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEdit(row)}
            title="Edit Coupon"
            className="w-8 h-8 p-0 flex items-center justify-center"
          />
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteConfirmCoupon(row)}
            title="Delete Coupon"
            className="w-8 h-8 p-0 flex items-center justify-center"
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Coupons & Marketing Campaigns
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure discount promo codes, usage caps & order rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={handleOpenCreate}
            className="h-11 sm:h-9 text-xs font-bold w-full sm:w-auto"
          >
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons by promo code..."
            className="w-full pl-9 pr-4 h-11 sm:h-10 text-sm sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#113BD0]/30 focus:border-[#113BD0]"
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
          emptyTitle="No coupons created"
          emptyDescription="Create your first promotional discount coupon to boost customer orders."
        />
      </div>

      {/* Mobile Coupon Cards */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading coupons...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            No coupons found.
          </div>
        ) : (
          data.map((coupon) => (
            <div
              key={coupon.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 text-xs"
            >
              {/* Header: Code & Quick Status Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[#F97316] border border-orange-200 dark:border-orange-900/50 inline-block">
                  {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(coupon)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title="Click to toggle status"
                >
                  <StatusBadge status={coupon.is_active ? 'ACTIVE' : 'INACTIVE'} size="xs" />
                </button>
              </div>

              {/* Discount Offer & Rules */}
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Discount</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}% OFF` : `₹ ${coupon.discount_value} FLAT`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Min Order</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {formatCurrency(coupon.min_order)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Max Cap</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {formatCurrency(coupon.max_discount)}
                  </span>
                </div>
              </div>

              {/* Validity, Redemptions & Icon-Only Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 gap-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 block truncate">
                    Valid: {formatDate(coupon.start_date)} - {formatDate(coupon.end_date)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                    {coupon.used_count || 0} / {coupon.usage_limit} redeemed
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant={coupon.is_active ? 'outline' : 'success'}
                    size="md"
                    icon={coupon.is_active ? Ban : CheckCircle2}
                    onClick={() => handleToggleStatus(coupon)}
                    className="w-10 h-10 sm:w-8 sm:h-8 p-0 flex items-center justify-center rounded-xl"
                    title={coupon.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
                  />

                  <Button
                    variant="outline"
                    size="md"
                    icon={Edit2}
                    onClick={() => handleOpenEdit(coupon)}
                    className="w-10 h-10 sm:w-8 sm:h-8 p-0 flex items-center justify-center rounded-xl"
                    title="Edit Coupon"
                  />

                  <Button
                    variant="danger"
                    size="md"
                    icon={Trash2}
                    onClick={() => setDeleteConfirmCoupon(coupon)}
                    className="w-10 h-10 sm:w-8 sm:h-8 p-0 flex items-center justify-center rounded-xl"
                    title="Delete Coupon"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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

          {/* Promo Banner Background Image & Live Preview */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#113BD0]" />
                <span>Customer App Promo Banner Image</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Shown on Home Carousel</span>
            </div>

            {/* Quick 1-Click Food Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                1-Click Food Theme Presets:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-bold">
                {[
                  { label: '🍛 Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=70' },
                  { label: '🍔 Burgers', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=70' },
                  { label: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=70' },
                  { label: '☕ Chai/Snacks', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=70' },
                  { label: '🥗 Pure Veg', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=70' },
                  { label: '🍬 Desserts', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=70' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer truncate ${
                      imageUrl === preset.url
                        ? 'bg-[#113BD0] text-white border-[#113BD0] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image Upload & URL Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File Upload */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Upload Local Image
                </label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#113BD0] cursor-pointer transition-colors text-xs font-bold text-slate-600 dark:text-slate-300">
                  <Upload className="w-4 h-4 text-[#113BD0]" />
                  <span>Choose Image File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const img = new Image()
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              const maxW = 700
                              let { width, height } = img
                              if (width > maxW) {
                                height = Math.round((height * maxW) / width)
                                width = maxW
                              }
                              canvas.width = width
                              canvas.height = height
                              const ctx = canvas.getContext('2d')
                              ctx.drawImage(img, 0, 0, width, height)
                              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.78)
                              setImageUrl(compressedBase64)
                            }
                            img.src = ev.target.result
                          }
                          reader.readAsDataURL(file)
                        } catch (err) {
                          console.error('Image compression error', err)
                        }
                      }
                    }}
                  />
                </label>
              </div>

              {/* Direct Image URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">
                  Or Paste Image URL
                </label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Live Real-time App Banner Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Live App Carousel Banner Preview (Full-Width Natural Photo):
              </span>
              <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-4 shadow-md flex items-center justify-between min-h-[115px]">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Banner Preview"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                )}
                {/* Contrast gradient without tinting photo */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10 z-1 pointer-events-none" />

                <div className="relative z-10 space-y-1 max-w-[70%]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider text-amber-300">
                    <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>LIVE PROMO</span>
                  </span>
                  <h4 className="text-base font-black tracking-tight leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {discountType === 'PERCENTAGE' ? `FLAT ${discountValue || 20}% OFF` : `FLAT ₹${discountValue || 50} OFF`}
                  </h4>
                  <p className="text-[11px] text-white/95 font-semibold truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    Use code <span className="font-black text-amber-300">{code || 'PROMO'}</span> on orders above ₹{minOrder || 149}
                  </p>
                </div>
                <div className="relative z-10">
                  <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-black text-[11px] shadow-sm flex items-center gap-1">
                    <span>Order Now</span>
                    <ArrowRight className="w-3 h-3 text-[#113BD0]" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Activate Coupon Immediately"
              description="Make visible and redeemable by customers in checkout"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {editingCoupon ? (
              <Button
                type="button"
                variant="danger"
                size="md"
                icon={Trash2}
                onClick={() => {
                  setDeleteConfirmCoupon(editingCoupon)
                }}
                className="text-xs"
              >
                Delete
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={actionLoading}>
                Save Coupon
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Safe Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmCoupon}
        onClose={() => setDeleteConfirmCoupon(null)}
        onConfirm={handleDeleteCoupon}
        title="Delete Promo Coupon?"
        message={`Are you sure you want to delete coupon ${deleteConfirmCoupon?.code}? Customers will no longer be able to apply this discount at checkout.`}
        confirmText="Delete Coupon"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  )
}

export default CouponList
