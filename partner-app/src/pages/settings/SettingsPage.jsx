import React, { useState } from 'react'
import {
  Store,
  Clock,
  Lock,
  Volume2,
  VolumeX,
  CreditCard,
  CheckCircle,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Power,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import restaurantApi from '../../api/restaurant.api'
import authApi from '../../api/auth.api'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Switch from '../../components/common/Switch'

export const SettingsPage = () => {
  const { user, restaurant, refreshProfile, updateStoreState } = useAuth()
  const { soundEnabled, toggleSound, playChime } = useSound()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('general')

  // Store Online State
  const [isOpen, setIsOpen] = useState(!!restaurant?.is_open)
  const [toggleLoading, setToggleLoading] = useState(false)

  // Profile fields
  const [name, setName] = useState(restaurant?.name || '')
  const [email, setEmail] = useState(restaurant?.email || '')
  const [phone, setPhone] = useState(restaurant?.phone || '')
  const [address, setAddress] = useState(restaurant?.address || '')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password / Security fields
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [securityPin, setSecurityPin] = useState('')
  const [securityLoading, setSecurityLoading] = useState(false)

  // Bank Account fields
  const [bankName, setBankName] = useState(restaurant?.bank_account?.bank_name || '')
  const [accountNumber, setAccountNumber] = useState(restaurant?.bank_account?.account_number || '')
  const [ifscCode, setIfscCode] = useState(restaurant?.bank_account?.ifsc_code || '')
  const [accountHolder, setAccountHolder] = useState(restaurant?.bank_account?.account_holder_name || '')
  const [bankLoading, setBankLoading] = useState(false)

  // Operating Hours State
  const defaultHours = [
    { day: 'Monday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Tuesday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Wednesday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Thursday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Friday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Saturday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Sunday', is_open: true, open_time: '09:00', close_time: '23:00' },
  ]
  const [hours, setHours] = useState(restaurant?.operating_hours || defaultHours)
  const [hoursLoading, setHoursLoading] = useState(false)

  // 1. Live Toggle Store
  const handleToggleStore = async (val) => {
    setToggleLoading(true)
    try {
      const res = await restaurantApi.toggleOpen(val)
      setIsOpen(val)
      if (res.data?.data) updateStoreState(res.data.data)
      toast.success(
        val ? 'Store is Now Online' : 'Store is Now Offline',
        val ? 'Active to receive customer orders.' : 'Customer orders paused.'
      )
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update store state.')
    } finally {
      setToggleLoading(false)
    }
  }

  // 2. Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await restaurantApi.updateProfile({
        name,
        email,
        phone,
        address,
      })
      await refreshProfile()
      toast.success('Profile Saved', 'Restaurant profile details updated successfully.')
    } catch (err) {
      toast.error('Save Failed', err.message || 'Unable to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  // 3. Save Bank Details
  const handleSaveBank = async (e) => {
    e.preventDefault()
    setBankLoading(true)
    try {
      await restaurantApi.updateBankAccount({
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: accountHolder,
      })
      await refreshProfile()
      toast.success('Bank Details Saved', 'Payout account information updated.')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update bank details.')
    } finally {
      setBankLoading(false)
    }
  }

  // 4. Save Security / Password
  const handleSaveSecurity = async (e) => {
    e.preventDefault()
    if (!newPassword && !securityPin) {
      toast.warning('Input Required', 'Please enter a new password or PIN.')
      return
    }
    setSecurityLoading(true)
    try {
      await authApi.changePassword({
        current_password: oldPassword,
        new_password: newPassword || undefined,
        login_pin: securityPin || undefined,
      })
      toast.success('Security Updated', 'Your credentials have been securely updated.')
      setOldPassword('')
      setNewPassword('')
      setSecurityPin('')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update credentials.')
    } finally {
      setSecurityLoading(false)
    }
  }

  // 5. Save Operating Hours
  const handleSaveHours = async () => {
    setHoursLoading(true)
    try {
      await restaurantApi.updateOperatingHours(hours)
      await refreshProfile()
      toast.success('Timings Saved', 'Weekly operational hours updated.')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update operating hours.')
    } finally {
      setHoursLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Store & Profile', icon: Store },
    { id: 'hours', label: 'Weekly Timings', icon: Clock },
    { id: 'bank', label: 'Bank Payouts', icon: CreditCard },
    { id: 'security', label: 'Security & PIN', icon: Lock },
    { id: 'sound', label: 'Sound Alert', icon: Volume2 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-[#2845D6]" />
          <span>Restaurant Settings & Operations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Manage kitchen timings, online status, bank payouts, and staff credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {tabs.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2845D6] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: General & Live Toggle */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          {/* Live Store Online Switch Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Live Order Acceptance State
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {isOpen ? '🟢 Kitchen is Currently ONLINE' : '🔴 Kitchen is Currently OFFLINE'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isOpen
                    ? 'Customers on Dastak can browse your menu and place new orders.'
                    : 'Your restaurant is paused. No new orders will arrive.'}
                </p>
              </div>
              <Switch
                checked={isOpen}
                disabled={toggleLoading}
                onChange={handleToggleStore}
              />
            </div>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Restaurant Profile Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Restaurant Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={Building}
                required
              />
              <Input
                label="Registered Mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Phone}
                required
              />
              <Input
                label="Contact Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
              />
              <Input
                label="Address / Kitchen Location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                icon={MapPin}
              />
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="md" type="submit" icon={Save} loading={profileLoading}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Weekly Operating Hours */}
      {activeTab === 'hours' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Weekly Operating Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Set daily opening and closing hours for automated store operations.</p>
            </div>
            <Button variant="primary" size="sm" icon={Save} loading={hoursLoading} onClick={handleSaveHours}>
              Save Hours
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {hours.map((h, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                <span className="w-28 font-bold text-slate-800">{h.day}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open_time}
                    disabled={!h.is_open}
                    onChange={(e) => {
                      const updated = [...hours]
                      updated[idx].open_time = e.target.value
                      setHours(updated)
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs disabled:opacity-50"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="time"
                    value={h.close_time}
                    disabled={!h.is_open}
                    onChange={(e) => {
                      const updated = [...hours]
                      updated[idx].close_time = e.target.value
                      setHours(updated)
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...hours]
                    updated[idx].is_open = !updated[idx].is_open
                    setHours(updated)
                  }}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                    h.is_open
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {h.is_open ? 'Open' : 'Closed'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bank Account */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveBank} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Bank Account for Payout Transfers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Account Holder Name"
              placeholder="e.g. Ramesh Kumar"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              required
            />
            <Input
              label="Bank Name"
              placeholder="e.g. State Bank of India / HDFC"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
            <Input
              label="Bank Account Number"
              placeholder="••••••••••••"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
            <Input
              label="IFSC Code"
              placeholder="SBIN0001234"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              required
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="md" type="submit" icon={Save} loading={bankLoading}>
              Save Bank Details
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Security & PIN */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 max-w-lg">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Change Password & Quick Security PIN
          </h3>
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="4-6 Digit Quick Login PIN (Optional)"
            type="password"
            placeholder="e.g. 1234"
            value={securityPin}
            onChange={(e) => setSecurityPin(e.target.value)}
          />
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="md" type="submit" icon={Save} loading={securityLoading}>
              Update Security
            </Button>
          </div>
        </form>
      )}

      {/* Tab 5: Sound Alert */}
      {activeTab === 'sound' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 max-w-lg">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Kitchen Audio Chime Notification
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-900">Audio Chime on Incoming Orders</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Play a loud, clear chime whenever a new order arrives from a customer.
              </p>
            </div>
            <Switch checked={soundEnabled} onChange={toggleSound} />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" icon={Volume2} onClick={playChime}>
              Test Play Chime
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
