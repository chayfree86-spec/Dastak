import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import settingsApi from '../../api/settings.api'
import { useApi } from '../../hooks/useApi'
import Tabs from '../../components/common/Tabs'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ZoneFormModal from './ZoneFormModal'
import { useToast } from '../../context/ToastContext'

export const SettingsPage = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // General Settings
  const [appName, setAppName] = useState('')
  const [tagline, setTagline] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  const [supportEmail, setSupportEmail] = useState('')

  // Order Settings
  const [cancelWindowMins, setCancelWindowMins] = useState('')
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false)

  // Delivery Settings
  const [dispatchMode, setDispatchMode] = useState('AUTO')
  const [maxRadiusKm, setMaxRadiusKm] = useState('')
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('')

  // Payment Settings
  const [codEnabled, setCodEnabled] = useState(true)
  const [onlineGateway, setOnlineGateway] = useState('RAZORPAY')

  // Commission Settings
  const [defaultCommission, setDefaultCommission] = useState('')

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
        if (data.support_phone !== undefined) setSupportPhone(data.support_phone)
        if (data.support_email !== undefined) setSupportEmail(data.support_email)
        if (data.cancel_window_mins !== undefined) setCancelWindowMins(String(data.cancel_window_mins))
        if (data.auto_accept !== undefined) setAutoAcceptOrders(Boolean(data.auto_accept))
        if (data.dispatch_mode !== undefined) setDispatchMode(data.dispatch_mode)
        if (data.max_radius_km !== undefined) setMaxRadiusKm(String(data.max_radius_km))
        if (data.base_delivery_fee !== undefined) setBaseDeliveryFee(String(data.base_delivery_fee))
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

  useEffect(() => {
    fetchSettings()
    fetchServiceAreas()
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

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        app_name: appName,
        tagline,
        support_phone: supportPhone,
        support_email: supportEmail,
        cancel_window_mins: Number(cancelWindowMins),
        auto_accept: autoAcceptOrders,
        dispatch_mode: dispatchMode,
        max_radius_km: Number(maxRadiusKm),
        base_delivery_fee: Number(baseDeliveryFee),
        cod_enabled: codEnabled,
        online_gateway: onlineGateway,
        default_commission: Number(defaultCommission),
      }
      const res = await settingsApi.updateSettings(payload)
      const data = res?.data || res || {}
      if (data) {
        if (data.app_name !== undefined) setAppName(data.app_name)
        if (data.tagline !== undefined) setTagline(data.tagline)
        if (data.support_phone !== undefined) setSupportPhone(data.support_phone)
        if (data.support_email !== undefined) setSupportEmail(data.support_email)
        if (data.cancel_window_mins !== undefined) setCancelWindowMins(String(data.cancel_window_mins))
        if (data.auto_accept !== undefined) setAutoAcceptOrders(Boolean(data.auto_accept))
        if (data.dispatch_mode !== undefined) setDispatchMode(data.dispatch_mode)
        if (data.max_radius_km !== undefined) setMaxRadiusKm(String(data.max_radius_km))
        if (data.base_delivery_fee !== undefined) setBaseDeliveryFee(String(data.base_delivery_fee))
        if (data.cod_enabled !== undefined) setCodEnabled(Boolean(data.cod_enabled))
        if (data.online_gateway !== undefined) setOnlineGateway(data.online_gateway)
        if (data.default_commission !== undefined) setDefaultCommission(String(data.default_commission))
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

        {activeTab !== 'service_areas' && (
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

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Brand Identity & Support</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Application Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
              <Input
                label="Brand Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
              <Input
                label="Toll-Free Support Phone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
              <Input
                label="Customer Support Email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
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
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Fleet & Dispatch Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <AmountInput
                label="Base Minimum Delivery Fee"
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(e.target.value)}
              />
            </div>
          </div>
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

        {activeTab !== 'service_areas' && (
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
