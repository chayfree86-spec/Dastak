import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Settings,
  Store,
  Bike,
  CreditCard,
  Percent,
  Bell,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Compass,
  Clock,
  Power,
  Timer,
  Upload,
  Image as ImageIcon,
  Phone,
  ShoppingBag,
  MessageSquare,
  Mail,
  Globe,
  Sparkles,
  X,
} from 'lucide-react'
import settingsApi from '../../api/settings.api'
import { useApi } from '../../hooks/useApi'
import Tabs from '../../components/common/Tabs'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import TimeSelect from '../../components/common/TimeSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ZoneFormModal from './ZoneFormModal'
import { useToast } from '../../context/ToastContext'

export const SettingsPage = () => {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(urlTab || 'general')
  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Listen to searchParams changes (e.g. from Finance link)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // General & Brand Settings
  const [appName, setAppName] = useState('')
  const [tagline, setTagline] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Multi-App Support & Helpline Numbers
  const [supportPhone, setSupportPhone] = useState('')
  const [customerSupportPhone, setCustomerSupportPhone] = useState('')
  const [partnerSupportPhone, setPartnerSupportPhone] = useState('')
  const [riderSupportPhone, setRiderSupportPhone] = useState('')
  const [supportWhatsapp, setSupportWhatsapp] = useState('')
  const [supportEmail, setSupportEmail] = useState('')

  // Order Settings
  const [cancelWindowMins, setCancelWindowMins] = useState('')
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false)

  // Delivery Settings
  const [dispatchMode, setDispatchMode] = useState('AUTO')
  const [maxRadiusKm, setMaxRadiusKm] = useState('')
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('')
  // Delivery charge customization
  const [allFreeDelivery, setAllFreeDelivery] = useState(false)
  const [freeDeliveryRadiusKm, setFreeDeliveryRadiusKm] = useState('')
  // Distance-based tiers: [{ up_to_km, free_above, fee }]
  const [deliveryTiers, setDeliveryTiers] = useState([])
  const [freeDeliveryMinOrder, setFreeDeliveryMinOrder] = useState('')
  const [baseDeliveryDistanceKm, setBaseDeliveryDistanceKm] = useState('')
  const [perKmCharge, setPerKmCharge] = useState('')
  const [maxDeliveryFee, setMaxDeliveryFee] = useState('')

  // Payment Settings
  const [codEnabled, setCodEnabled] = useState(true)
  const [onlineGateway, setOnlineGateway] = useState('RAZORPAY')

  // Commission Settings
  const [defaultCommission, setDefaultCommission] = useState('')

  // Store / Service Hours
  const [storeMode, setStoreMode] = useState('24x7') // '24x7' | 'scheduled' | 'closed'
  const [storeOpenTime, setStoreOpenTime] = useState('09:00')
  const [storeCloseTime, setStoreCloseTime] = useState('22:00')
  const [storeClosedMessage, setStoreClosedMessage] = useState('')
  const [storeStatus, setStoreStatus] = useState(null)
  const [savingHours, setSavingHours] = useState(false)

  // Service Areas Management State
  const [serviceAreas, setServiceAreas] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSettings = async () => {
    setLoadingSettings(true)
    try {
      const res = await settingsApi.getSettings()
      const data = res?.data || res || {}
      if (data) {
        if (data.app_name !== undefined) setAppName(data.app_name)
        if (data.tagline !== undefined) setTagline(data.tagline)
        if (data.brand_logo_url !== undefined) setBrandLogoUrl(data.brand_logo_url || '')
        if (data.support_phone !== undefined) setSupportPhone(data.support_phone)
        if (data.customer_support_phone !== undefined) setCustomerSupportPhone(data.customer_support_phone)
        if (data.partner_support_phone !== undefined) setPartnerSupportPhone(data.partner_support_phone)
        if (data.rider_support_phone !== undefined) setRiderSupportPhone(data.rider_support_phone)
        if (data.support_whatsapp !== undefined) setSupportWhatsapp(data.support_whatsapp)
        if (data.support_email !== undefined) setSupportEmail(data.support_email)
        if (data.cancel_window_mins !== undefined) setCancelWindowMins(String(data.cancel_window_mins))
        if (data.auto_accept !== undefined) setAutoAcceptOrders(Boolean(data.auto_accept))
        if (data.dispatch_mode !== undefined) setDispatchMode(data.dispatch_mode)
        if (data.max_radius_km !== undefined) setMaxRadiusKm(String(data.max_radius_km))
        if (data.base_delivery_fee !== undefined) setBaseDeliveryFee(String(data.base_delivery_fee))
        if (data.all_free_delivery !== undefined) setAllFreeDelivery(Boolean(data.all_free_delivery))
        if (data.free_delivery_radius_km !== undefined) setFreeDeliveryRadiusKm(String(data.free_delivery_radius_km))
        if (Array.isArray(data.delivery_tiers)) {
          setDeliveryTiers(data.delivery_tiers.map((t) => ({
            up_to_km: String(t.up_to_km ?? ''),
            free_above: String(t.free_above ?? ''),
            fee: String(t.fee ?? ''),
          })))
        }
        if (data.free_delivery_min_order !== undefined) setFreeDeliveryMinOrder(String(data.free_delivery_min_order))
        if (data.base_delivery_distance_km !== undefined) setBaseDeliveryDistanceKm(String(data.base_delivery_distance_km))
        if (data.per_km_charge !== undefined) setPerKmCharge(String(data.per_km_charge))
        if (data.max_delivery_fee !== undefined) setMaxDeliveryFee(String(data.max_delivery_fee))
        if (data.cod_enabled !== undefined) setCodEnabled(Boolean(data.cod_enabled))
        if (data.online_gateway !== undefined) setOnlineGateway(data.online_gateway)
        if (data.default_commission !== undefined) setDefaultCommission(String(data.default_commission))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoadingSettings(false)
    }
  }

  const fetchServiceAreas = async () => {
    setLoadingZones(true)
    try {
      const res = await settingsApi.getServiceAreas()
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      setServiceAreas(list)
    } catch (err) {
      console.error('Failed to load service areas:', err)
    } finally {
      setLoadingZones(false)
    }
  }

  const fetchStoreHours = async () => {
    try {
      const res = await settingsApi.getStoreHours()
      const data = res?.data || res || {}
      if (data.service_mode !== undefined) setStoreMode(data.service_mode)
      if (data.service_open_time) setStoreOpenTime(data.service_open_time)
      if (data.service_close_time) setStoreCloseTime(data.service_close_time)
      if (data.service_closed_message !== undefined) setStoreClosedMessage(data.service_closed_message || '')
      if (data.status) setStoreStatus(data.status)
    } catch (err) {
      console.error('Failed to load store hours:', err)
    }
  }

  const handleSaveStoreHours = async (e) => {
    if (e) e.preventDefault()
    setSavingHours(true)
    try {
      const payload = {
        service_mode: storeMode,
        service_open_time: storeOpenTime,
        service_close_time: storeCloseTime,
        service_closed_message: storeClosedMessage || '',
      }
      const res = await settingsApi.updateStoreHours(payload)
      const data = res?.data || res || {}
      if (data.status) setStoreStatus(data.status)
      toast.success('Store Hours Saved', 'Customer ordering availability updated.')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update store hours.')
    } finally {
      setSavingHours(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchServiceAreas()
    fetchStoreHours()
  }, [])

  const handleToggleZoneStatus = async (zone) => {
    const newStatus = !zone.is_active
    // Optimistic UI update
    setServiceAreas((prev) =>
      prev.map((z) => (z.id === zone.id ? { ...z, is_active: newStatus } : z))
    )

    try {
      await settingsApi.updateServiceArea(zone.id, { is_active: newStatus })
      toast.success('Status Updated', `${zone.name} is now ${newStatus ? 'Live' : 'Disabled'}.`)
    } catch (err) {
      // Rollback on failure
      setServiceAreas((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: !newStatus } : z))
      )
      toast.error('Update Failed', err.message || 'Unable to update zone status.')
    }
  }

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return
    setActionLoading(true)
    try {
      await settingsApi.deleteServiceArea(zoneToDelete.id)
      setServiceAreas((prev) => prev.filter((z) => z.id !== zoneToDelete.id))
      toast.success('Area Deleted', `${zoneToDelete.name} has been removed.`)
      setDeleteConfirmOpen(false)
      setZoneToDelete(null)
    } catch (err) {
      toast.error('Delete Failed', err.message || 'Unable to delete service area.')
    } finally {
      setActionLoading(false)
    }
  }

  const addTier = () =>
    setDeliveryTiers((prev) => [...prev, { up_to_km: '', free_above: '', fee: '' }])
  const removeTier = (i) =>
    setDeliveryTiers((prev) => prev.filter((_, idx) => idx !== i))
  const updateTier = (i, field, val) =>
    setDeliveryTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)))

  // Handle URL actions (like action=add_tier from Finance page)
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'add_tier') {
      setActiveTab('delivery')
      addTier()
      setTimeout(() => {
        const el = document.getElementById('section-distance-tiers')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-[#113BD0]', 'ring-offset-2')
          setTimeout(() => el.classList.remove('ring-2', 'ring-[#113BD0]', 'ring-offset-2'), 2000)
        }
      }, 350)
    }
  }, [searchParams])

  const handleLogoUpload = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return

    // Validations: max 10MB, images only
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file (PNG, JPG, SVG, WEBP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Brand logo file size must not exceed 10 MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const res = await settingsApi.uploadLogo(formData)
      const data = res?.data || res || {}
      const logoUrl = data.url || ''

      if (logoUrl) {
        setBrandLogoUrl(logoUrl)
        toast.success('Brand Logo Uploaded', 'New brand logo saved and applied across platform.')
      }
    } catch (err) {
      toast.error('Upload Failed', err.message || 'Unable to upload brand logo.')
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setBrandLogoUrl('')
    try {
      await settingsApi.updateSettings({ brand_logo_url: '' })
      toast.success('Logo Removed', 'Brand logo has been reset to default.')
    } catch (err) {
      console.error('Failed to reset logo:', err)
    }
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        app_name: appName,
        tagline,
        brand_logo_url: brandLogoUrl,
        support_phone: supportPhone,
        customer_support_phone: customerSupportPhone,
        partner_support_phone: partnerSupportPhone,
        rider_support_phone: riderSupportPhone,
        support_whatsapp: supportWhatsapp,
        support_email: supportEmail,
        cancel_window_mins: Number(cancelWindowMins),
        auto_accept: autoAcceptOrders,
        dispatch_mode: dispatchMode,
        max_radius_km: Number(maxRadiusKm),
        base_delivery_fee: Number(baseDeliveryFee),
        all_free_delivery: allFreeDelivery,
        free_delivery_radius_km: Number(freeDeliveryRadiusKm) || 0,
        delivery_tiers: deliveryTiers
          .map((t) => ({
            up_to_km: Number(t.up_to_km) || 0,
            free_above: Number(t.free_above) || 0,
            fee: Number(t.fee) || 0,
          }))
          .filter((t) => t.up_to_km > 0)
          .sort((a, b) => a.up_to_km - b.up_to_km),
        free_delivery_min_order: Number(freeDeliveryMinOrder) || 0,
        base_delivery_distance_km: Number(baseDeliveryDistanceKm) || 0,
        per_km_charge: Number(perKmCharge) || 0,
        max_delivery_fee: Number(maxDeliveryFee) || 0,
        cod_enabled: codEnabled,
        online_gateway: onlineGateway,
        default_commission: Number(defaultCommission),
      }
      const res = await settingsApi.updateSettings(payload)
      const data = res?.data || res || {}
      if (data) {
        if (data.app_name !== undefined) setAppName(data.app_name)
        if (data.tagline !== undefined) setTagline(data.tagline)
        if (data.brand_logo_url !== undefined) setBrandLogoUrl(data.brand_logo_url || '')
        if (data.support_phone !== undefined) setSupportPhone(data.support_phone)
        if (data.customer_support_phone !== undefined) setCustomerSupportPhone(data.customer_support_phone)
        if (data.partner_support_phone !== undefined) setPartnerSupportPhone(data.partner_support_phone)
        if (data.rider_support_phone !== undefined) setRiderSupportPhone(data.rider_support_phone)
        if (data.support_whatsapp !== undefined) setSupportWhatsapp(data.support_whatsapp)
        if (data.support_email !== undefined) setSupportEmail(data.support_email)
        if (data.cancel_window_mins !== undefined) setCancelWindowMins(String(data.cancel_window_mins))
        if (data.auto_accept !== undefined) setAutoAcceptOrders(Boolean(data.auto_accept))
        if (data.dispatch_mode !== undefined) setDispatchMode(data.dispatch_mode)
        if (data.max_radius_km !== undefined) setMaxRadiusKm(String(data.max_radius_km))
        if (data.base_delivery_fee !== undefined) setBaseDeliveryFee(String(data.base_delivery_fee))
        if (data.all_free_delivery !== undefined) setAllFreeDelivery(Boolean(data.all_free_delivery))
        if (data.free_delivery_radius_km !== undefined) setFreeDeliveryRadiusKm(String(data.free_delivery_radius_km))
        if (data.free_delivery_min_order !== undefined) setFreeDeliveryMinOrder(String(data.free_delivery_min_order))
        if (data.base_delivery_distance_km !== undefined) setBaseDeliveryDistanceKm(String(data.base_delivery_distance_km))
        if (data.per_km_charge !== undefined) setPerKmCharge(String(data.per_km_charge))
        if (data.max_delivery_fee !== undefined) setMaxDeliveryFee(String(data.max_delivery_fee))
      }
      toast.success('Settings Saved', 'Platform configuration updated successfully in database.')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update platform settings.')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General & Brand', icon: Settings },
    { id: 'store_hours', label: 'Store Hours', icon: Clock },
    { id: 'orders', label: 'Order Rules', icon: Store },
    { id: 'delivery', label: 'Delivery & Fleet', icon: Bike },
    { id: 'payments', label: 'Payments & COD', icon: CreditCard },
    { id: 'commission', label: 'Platform Commission', icon: Percent },
    { id: 'service_areas', label: 'Service Areas', icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Platform System Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure global brand details, order rules, delivery charge parameters, and service geofences.
          </p>
        </div>

        {!['service_areas', 'store_hours'].includes(activeTab) && (
          <Button
            type="button"
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={saving}
          >
            Save Changes
          </Button>
        )}
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(newTab) => {
          setActiveTab(newTab)
          setSearchParams({ tab: newTab })
        }}
      />

      {loadingSettings && activeTab !== 'service_areas' ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-2">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-11 bg-slate-100 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50" />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Tab 1: General & Brand */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* SECTION 1: Brand Identity & Logo System */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#113BD0]" />
                    <span>Brand Identity & Visual Assets</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage your primary brand logo, name, and promotional tagline across all customer and merchant touchpoints.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Brand Logo Upload Box (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Brand Logo
                    </label>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3">
                      {/* Logo Preview Container */}
                      <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-xs overflow-hidden relative group">
                        {brandLogoUrl ? (
                          <img
                            src={brandLogoUrl}
                            alt="Brand Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              No Logo Set
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Size Placeholder & Recommended Dimensions */}
                      <div className="space-y-1 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-black text-[#113BD0] dark:text-blue-400">
                          <span>Recommended: 512 × 512 px (1:1) or 1024 × 256 px</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          PNG (transparent background), SVG, WEBP, or JPG • Max 10 MB
                        </p>
                      </div>

                      {/* Upload and Remove Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          icon={Upload}
                          loading={uploadingLogo}
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold"
                        >
                          {brandLogoUrl ? 'Change Logo' : 'Upload Logo'}
                        </Button>

                        {brandLogoUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon={Trash2}
                            onClick={handleRemoveLogo}
                            className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Brand Details Fields (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <Input
                      label="Application / Brand Name"
                      required
                      placeholder="e.g. Dastak"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      helperText="Platform name displayed on mobile apps, customer notifications, and receipts."
                    />

                    <Input
                      label="Brand Tagline"
                      placeholder="e.g. Jo Chahiye, Ghar Par"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      helperText="Primary brand slogan shown on home screens and header branding."
                    />

                    <Input
                      label="Custom Logo Direct URL (Optional)"
                      placeholder="https://your-domain.com/assets/logo.png"
                      value={brandLogoUrl}
                      onChange={(e) => setBrandLogoUrl(e.target.value)}
                      helperText="You can also paste a direct public image link instead of uploading a file."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Multi-App Support & Helpline Numbers */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Application-Specific Helpline & Support Numbers</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Assign distinct contact numbers for each platform audience. Each app will dynamically display its assigned helpline.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-750 px-2.5 py-1 rounded-lg shrink-0">
                    Live Multi-App Sync
                  </span>
                </div>

                {/* 4 Dedicated App Phone Numbers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Common / Toll-Free Support Phone */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Common / Toll-Free Number
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        Global Fallback
                      </span>
                    </div>

                    <Input
                      placeholder="e.g. 9005271986 or 1800-123-4567"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Default platform helpline used across any screen if a specific number is empty.
                    </p>
                  </div>

                  {/* 2. Customer App Helpline */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Customer App Support
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                        Customer App
                      </span>
                    </div>

                    <Input
                      placeholder="e.g. 9005271986"
                      value={customerSupportPhone}
                      onChange={(e) => setCustomerSupportPhone(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Displayed on Customer Mobile & Web app (Account page, More menu, and Helpdesk).
                    </p>
                  </div>

                  {/* 3. Partner / Restaurant Helpline */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <Store className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Partner / Merchant Support
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-md">
                        Partner App
                      </span>
                    </div>

                    <Input
                      placeholder="e.g. 9005271986"
                      value={partnerSupportPhone}
                      onChange={(e) => setPartnerSupportPhone(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Displayed on Partner App & Restaurant Merchant Dashboard for kitchen & billing support.
                    </p>
                  </div>

                  {/* 4. Rider / Delivery Boy Helpline */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Bike className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Rider / Fleet Support
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        Rider App
                      </span>
                    </div>

                    <Input
                      placeholder="e.g. 9005271986"
                      value={riderSupportPhone}
                      onChange={(e) => setRiderSupportPhone(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Displayed in Delivery Boy App for emergency dispatch, trip assistance, and rider support.
                    </p>
                  </div>
                </div>

                {/* Additional Communication Channels (WhatsApp & Email) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        WhatsApp Support Number (Optional)
                      </span>
                    </div>
                    <Input
                      placeholder="e.g. 9005271986"
                      value={supportWhatsapp}
                      onChange={(e) => setSupportWhatsapp(e.target.value)}
                      helperText="Enables 1-click WhatsApp support chat for quick resolution."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mail className="w-4 h-4 text-[#113BD0]" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Official Support Email
                      </span>
                    </div>
                    <Input
                      placeholder="e.g. support@dastakdelivery.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      helperText="Official platform inbox for customer escalations and billing disputes."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Tab: Store Hours */}
        {activeTab === 'store_hours' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Customer Ordering Availability</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control when customers can place orders. Useful for rural areas that can't offer 24×7 service yet.
                Customers can still browse when closed — only ordering is paused.
              </p>
            </div>

            {/* Live status banner */}
            {storeStatus && (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  storeStatus.is_open
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    storeStatus.is_open
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-black ${storeStatus.is_open ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {storeStatus.is_open ? 'Ordering is OPEN right now' : 'Ordering is CLOSED right now'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {storeStatus.is_open
                      ? storeStatus.closes_at
                        ? `Closes at ${new Date(storeStatus.closes_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Always accepting orders (24×7)'
                      : storeStatus.opens_at
                        ? `Opens at ${new Date(storeStatus.opens_at).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
                        : 'Temporarily closed'}
                  </p>
                </div>
              </div>
            )}

            {/* Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Service Mode"
                value={storeMode}
                onChange={setStoreMode}
                options={[
                  { value: '24x7', label: 'Always Open (24×7)' },
                  { value: 'scheduled', label: 'Daily Schedule (Set Open/Close Time)' },
                  { value: 'closed', label: 'Temporarily Closed' },
                ]}
              />
            </div>

            {/* Schedule times — only for scheduled mode */}
            {storeMode === 'scheduled' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TimeSelect
                  label="Opening Time"
                  value={storeOpenTime}
                  onChange={setStoreOpenTime}
                />
                <TimeSelect
                  label="Closing Time"
                  value={storeCloseTime}
                  onChange={setStoreCloseTime}
                />
                <p className="sm:col-span-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Times are in IST. For overnight service set a closing time earlier than opening (e.g. 18:00 → 02:00).</span>
                </p>
              </div>
            )}

            {/* Custom closed message — for closed / scheduled */}
            {storeMode !== '24x7' && (
              <div>
                <Input
                  label="Custom Closed Message (optional)"
                  value={storeClosedMessage}
                  placeholder="e.g. We deliver 9 AM–10 PM. Order now for the next slot!"
                  onChange={(e) => setStoreClosedMessage(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Shown to customers when ordering is closed.</p>
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              <Button type="button" variant="primary" size="lg" icon={Save} loading={savingHours} onClick={handleSaveStoreHours} className="w-full sm:w-auto">
                Save Store Hours
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Order Rules */}
        {activeTab === 'orders' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Order Management Policies</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Cancellation Window (Minutes)"
                type="number"
                min="0"
                max="15"
                value={cancelWindowMins}
                onChange={(e) => setCancelWindowMins(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <Switch
                checked={autoAcceptOrders}
                onChange={setAutoAcceptOrders}
                label="Auto-Accept Incoming Orders"
                description="Automatically accept orders if restaurant doesn't respond in 60s"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Delivery & Fleet */}
        {activeTab === 'delivery' && (
          <>
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Fleet & Dispatch Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Dispatch Engine Mode"
                value={dispatchMode}
                onChange={setDispatchMode}
                options={[
                  { value: 'AUTO', label: 'Automated Broadcast' },
                  { value: 'MANUAL', label: 'Manual Admin Dispatch Only' },
                  { value: 'HYBRID', label: 'Hybrid (Auto + Fallback)' },
                ]}
              />
              <Input
                label="Max Platform Delivery Radius (KM)"
                type="number"
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 1 — Free Delivery Rules */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Free Delivery Rules</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Decide when customers pay ₹0 for delivery.</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <Switch
                checked={allFreeDelivery}
                onChange={setAllFreeDelivery}
                label="Free Delivery for Everyone (Festival Mode)"
                description="Turn ON to make delivery ₹0 for ALL orders — any order value, any distance. Overrides everything else."
              />
            </div>

            {deliveryTiers.length > 0 && !allFreeDelivery && (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                ⚠ Overridden by Distance-Based Tiers (Section 3). These simple free rules are inactive while tiers exist.
              </p>
            )}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${allFreeDelivery || deliveryTiers.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <Input
                  label="Free Delivery Within (KM)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={freeDeliveryRadiusKm}
                  onChange={(e) => setFreeDeliveryRadiusKm(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Orders within this distance get free delivery, any order value. 0 = off. (e.g. 3 = free up to 3 km)</p>
              </div>
              <div>
                <AmountInput
                  label="Free Delivery Above (Order Amount)"
                  value={freeDeliveryMinOrder}
                  onChange={(e) => setFreeDeliveryMinOrder(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Orders at/above this amount get free delivery. 0 = never free.</p>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Standard Delivery Charges */}
          <div className={`p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 ${allFreeDelivery || deliveryTiers.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Standard Delivery Charges</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Default fee when the order isn't free (and no distance tier below matches).
                {deliveryTiers.length > 0 && !allFreeDelivery && (
                  <span className="block font-semibold text-amber-600 dark:text-amber-400 mt-1">⚠ Currently overridden by Distance-Based Tiers (Section 3).</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <AmountInput
                  label="Base Delivery Fee"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Standard flat fee for a delivery.</p>
              </div>
              <div>
                <Input
                  label="Base Fee Covers Distance (KM)"
                  type="number"
                  min="0"
                  value={baseDeliveryDistanceKm}
                  onChange={(e) => setBaseDeliveryDistanceKm(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Base fee applies up to this distance; beyond it, per-km charge is added.</p>
              </div>
              <div>
                <AmountInput
                  label="Per KM Charge (Beyond Base Distance)"
                  value={perKmCharge}
                  onChange={(e) => setPerKmCharge(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Extra charge for each km beyond the base distance. 0 = flat fee only.</p>
              </div>
              <div>
                <AmountInput
                  label="Maximum Delivery Fee (Cap)"
                  value={maxDeliveryFee}
                  onChange={(e) => setMaxDeliveryFee(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Delivery fee never exceeds this. 0 = no cap.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-black text-[#113BD0] dark:text-blue-400">Formula: </span>
              <strong>Base Fee</strong> + (distance − Base KM) × <strong>Per-KM Charge</strong>, capped at the Maximum Fee.
            </div>
          </div>

          {/* SECTION 3 — Distance-Based Tiers (Advanced) */}
          <div
            id="section-distance-tiers"
            className={`p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 transition-all ${allFreeDelivery ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Distance-Based Tiers (Advanced)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Optional. Set a different free-delivery order value &amp; fee per km band. When added, these override Section 2 above.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addTier}>
                Add Tier
              </Button>
            </div>

            {deliveryTiers.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No tiers — using Standard Charges above. Example: “up to 2 km → free above ₹199, else ₹20”.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-[0.8fr_1fr_1fr_1fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <span>Band (KM)</span>
                  <span>Up to (KM)</span>
                  <span>Free Above (₹)</span>
                  <span>Delivery Fee (₹)</span>
                  <span />
                </div>
                {deliveryTiers.map((tier, i) => {
                  const fromKm = i === 0 ? 0 : (Number(deliveryTiers[i - 1].up_to_km) || 0)
                  return (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-[0.8fr_1fr_1fr_1fr_auto] gap-2 items-center">
                      <div className="h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-[#113BD0] dark:text-blue-400 col-span-2 sm:col-span-1">
                        {fromKm}–{tier.up_to_km || '?'} km
                      </div>
                      <Input
                        type="number"
                        min={fromKm}
                        step="0.5"
                        placeholder="e.g. 2"
                        value={tier.up_to_km}
                        onChange={(e) => updateTier(i, 'up_to_km', e.target.value)}
                      />
                      <AmountInput
                        placeholder="199"
                        value={tier.free_above}
                        onChange={(e) => updateTier(i, 'free_above', e.target.value)}
                      />
                      <AmountInput
                        placeholder="20"
                        value={tier.fee}
                        onChange={(e) => updateTier(i, 'fee', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer justify-self-end"
                        title="Remove tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                <p className="text-[11px] text-slate-400 pt-1">
                  Each row is a distance band (shown as “from–to km”). Keep “Up to” values increasing. “Free Above 0” = never free in that band. Orders beyond the largest band use the last band.
                </p>
              </div>
            )}
          </div>
          </>
        )}

        {/* Tab 4: Payments & COD */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Gateway Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Primary Payment Gateway"
                value={onlineGateway}
                onChange={setOnlineGateway}
                options={[
                  { value: 'RAZORPAY', label: 'Razorpay PG' },
                  { value: 'CASHFREE', label: 'Cashfree Payments' },
                  { value: 'PAYTM', label: 'Paytm All-In-One' },
                ]}
              />
            </div>
            <div className="pt-2">
              <Switch
                checked={codEnabled}
                onChange={setCodEnabled}
                label="Enable Cash on Delivery (COD)"
                description="Allow customers to place orders with cash payment on arrival"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Platform Commission */}
        {activeTab === 'commission' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Default Merchant Commission</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default Platform Commission (%)"
                type="number"
                min="0"
                max="100"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 6: Service Areas */}
        {activeTab === 'service_areas' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            {/* Header with Add Area Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Delivery Service Areas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage geographical zones where customer orders and fleet delivery are active.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setSelectedZone(null)
                  setZoneModalOpen(true)
                }}
              >
                Add Service Area
              </Button>
            </div>

            {/* Loading Indicator */}
            {loadingZones && (
              <div className="py-8 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#113BD0] rounded-full animate-spin" />
              </div>
            )}

            {/* Service Areas List */}
            {!loadingZones && serviceAreas.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No Service Areas Configured</p>
                <p className="text-[11px]">Click "Add Service Area" to define your first operational delivery zone.</p>
              </div>
            )}

            {!loadingZones && serviceAreas.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {serviceAreas.map((area) => (
                  <div key={area.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{area.name}</span>
                        {area.city && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                            {area.city}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#113BD0] dark:text-blue-400 rounded-md font-mono">
                          {area.radius_km || 10} KM Radius
                        </span>
                      </div>
                      
                      {area.center_latitude && area.center_longitude && (
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Compass className="w-3 h-3 text-slate-400" />
                          <span>Lat: {Number(area.center_latitude).toFixed(4)}, Lng: {Number(area.center_longitude).toFixed(4)}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={area.is_active}
                        onChange={() => handleToggleZoneStatus(area)}
                        label={area.is_active ? 'Live' : 'Disabled'}
                      />

                      <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-700 pl-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedZone(area)
                            setZoneModalOpen(true)
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Edit Service Area"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setZoneToDelete(area)
                            setDeleteConfirmOpen(true)
                          }}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Service Area"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!['service_areas', 'store_hours'].includes(activeTab) && (
          <div className="flex items-center justify-end">
            <Button type="submit" variant="primary" size="lg" icon={Save} loading={saving} className="w-full sm:w-auto">
              Save All Settings
            </Button>
          </div>
        )}
      </form>
      )}

      {/* Add / Edit Service Area Modal */}
      <ZoneFormModal
        isOpen={zoneModalOpen}
        onClose={() => {
          setZoneModalOpen(false)
          setSelectedZone(null)
        }}
        zone={selectedZone}
        existingAreas={serviceAreas}
        onSaveSuccess={fetchServiceAreas}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setZoneToDelete(null)
        }}
        onConfirm={handleDeleteZone}
        loading={actionLoading}
        type="danger"
        title="Delete Service Area?"
        message={`Are you sure you want to remove ${zoneToDelete?.name}? Restaurants and customers mapped to this geofence may need reassignment.`}
        confirmText="Delete Area"
      />
    </div>
  )
}

export default SettingsPage
