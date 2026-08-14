import React, { useState } from 'react'
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
} from 'lucide-react'
import settingsApi from '../../api/settings.api'
import { useApi } from '../../hooks/useApi'
import Tabs from '../../components/common/Tabs'
import Input from '../../components/common/Input'
import AmountInput from '../../components/common/AmountInput'
import CustomSelect from '../../components/common/CustomSelect'
import Switch from '../../components/common/Switch'
import Button from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'

export const SettingsPage = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  // General Settings
  const [appName, setAppName] = useState('Dastak')
  const [tagline, setTagline] = useState('Jo Chahiye, Ghar Par')
  const [supportPhone, setSupportPhone] = useState('1800-123-4567')
  const [supportEmail, setSupportEmail] = useState('support@dastakdelivery.com')

  // Order Settings
  const [cancelWindowMins, setCancelWindowMins] = useState('1')
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false)

  // Delivery Settings
  const [dispatchMode, setDispatchMode] = useState('AUTO')
  const [maxRadiusKm, setMaxRadiusKm] = useState('12')
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('35.00')

  // Payment Settings
  const [codEnabled, setCodEnabled] = useState(true)
  const [onlineGateway, setOnlineGateway] = useState('RAZORPAY')

  // Commission Settings
  const [defaultCommission, setDefaultCommission] = useState('15')

  // Service Areas
  const [serviceAreas, setServiceAreas] = useState([
    { id: 1, name: 'Delhi NCR (Central, South, North)', is_active: true },
    { id: 2, name: 'Noida & Greater Noida (Sec 18, 62, 137)', is_active: true },
    { id: 3, name: 'Gurgaon Cyber City & Golf Course Ext', is_active: true },
    { id: 4, name: 'Faridabad Express Sector', is_active: false },
  ])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.updateSettings({
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
        default_commission: Number(defaultCommission),
      })
      toast.success('Settings Saved', 'Platform configuration updated successfully.')
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

        <Button variant="primary" size="sm" icon={Save} onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Brand Identity & Support</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platform Brand Name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
              <Input
                label="Brand Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Support Helpline Number"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
              <Input
                label="Support Desk Email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Order Cancellation & Acceptance</h3>

            <div className="max-w-md space-y-4">
              <Input
                label="Customer Cancellation Grace Window (Minutes)"
                type="number"
                min="0"
                max="10"
                helperText="Duration within which a customer can cancel an order before restaurant preparation starts."
                value={cancelWindowMins}
                onChange={(e) => setCancelWindowMins(e.target.value)}
              />

              <div className="pt-2">
                <Switch
                  checked={autoAcceptOrders}
                  onChange={setAutoAcceptOrders}
                  label="Auto-Accept Orders on Partner Behalf"
                  description="Automatically move incoming new orders to preparing if restaurant doesn't respond in 3 mins."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery */}
        {activeTab === 'delivery' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Fleet Dispatch & Radius</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Rider Assignment Strategy"
                value={dispatchMode}
                onChange={setDispatchMode}
                options={[
                  { value: 'AUTO', label: 'Automated Nearest-Rider Dispatch' },
                  { value: 'MANUAL', label: 'Manual Admin Assignment Only' },
                ]}
              />

              <Input
                label="Global Max Delivery Radius (KM)"
                type="number"
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(e.target.value)}
              />
            </div>

            <div className="max-w-xs">
              <AmountInput
                label="Base Minimum Delivery Charge"
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Payments */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Gateways & COD</h3>

            <div className="space-y-4 max-w-md">
              <CustomSelect
                label="Primary Online Gateway"
                value={onlineGateway}
                onChange={setOnlineGateway}
                options={[
                  { value: 'RAZORPAY', label: 'Razorpay (UPI, Cards, Netbanking)' },
                  { value: 'PHONEPE', label: 'PhonePe Payment Gateway' },
                  { value: 'CASHFREE', label: 'Cashfree Payments' },
                ]}
              />

              <div className="pt-2">
                <Switch
                  checked={codEnabled}
                  onChange={setCodEnabled}
                  label="Enable Cash on Delivery (COD)"
                  description="Allow customers to pay via cash to delivery rider"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Commission */}
        {activeTab === 'commission' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Default Onboarding Commission</h3>

            <div className="max-w-xs">
              <Input
                label="Default Platform Commission (%)"
                type="number"
                min="0"
                max="100"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                helperText="Standard rate applied when onboarding new restaurants."
              />
            </div>
          </div>
        )}

        {/* Tab 6: Service Areas */}
        {activeTab === 'service_areas' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active City Delivery Zones</h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {serviceAreas.map((area) => (
                <div key={area.id} className="py-3 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{area.name}</span>
                  <Switch
                    checked={area.is_active}
                    onChange={(checked) => {
                      setServiceAreas((prev) =>
                        prev.map((a) => (a.id === area.id ? { ...a, is_active: checked } : a))
                      )
                    }}
                    label={area.is_active ? 'Live' : 'Disabled'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" size="lg" icon={Save} loading={saving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
