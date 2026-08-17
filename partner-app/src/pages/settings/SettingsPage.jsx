import React, { useState, useEffect } from 'react'
import {
  Store,
  Clock,
  Lock,
  Volume2,
  Building,
  Phone,
  Mail,
  MapPin,
  Copy,
  ShieldCheck,
  Play,
  Wallet,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSound } from '../../context/SoundContext'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'
import restaurantApi from '../../api/restaurant.api'
import authApi from '../../api/auth.api'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Switch from '../../components/common/Switch'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import ErrorState from '../../components/common/ErrorState'

export const SettingsPage = () => {
  const { user, restaurant: cachedRest, refreshProfile, updateStoreState } = useAuth()
  const { soundEnabled, toggleSound, playChime } = useSound()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('general')

  // Fetch real restaurant profile from backend
  const {
    data: liveRestData,
    loading: initialLoading,
    error: loadError,
    retry,
  } = useApi(() => restaurantApi.getRestaurant(), [])

  // Store Online State
  const [isOpen, setIsOpen] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  // Profile fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isPureVeg, setIsPureVeg] = useState(false)
  const [avgPrepTime, setAvgPrepTime] = useState('15')
  const [profileLoading, setProfileLoading] = useState(false)

  // Password / Security fields
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [securityLoading, setSecurityLoading] = useState(false)

  // Bank Account fields
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [upiId, setUpiId] = useState('')
  const [bankLoading, setBankLoading] = useState(false)

  // Operating Hours State
  const defaultHours = [
    { day: 'Monday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Tuesday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Wednesday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Thursday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Friday', is_open: true, open_time: '09:00', close_time: '23:00' },
    { day: 'Saturday', is_open: true, open_time: '09:00', close_time: '23:30' },
    { day: 'Sunday', is_open: true, open_time: '09:00', close_time: '23:30' },
  ]
  const [hours, setHours] = useState(defaultHours)
  const [hoursLoading, setHoursLoading] = useState(false)

  // Populate state whenever real backend data loads or cachedRest updates
  useEffect(() => {
    const data = liveRestData || cachedRest
    if (!data) return

    setIsOpen(!!data.is_open)
    setName(data.name || '')
    setEmail(data.email || '')
    setPhone(data.phone || data.mobile || user?.mobile || '')
    setAddress(data.address_line1 || data.address || '')
    setIsPureVeg(!!data.is_pure_veg)
    setAvgPrepTime(String(data.preparation_time_minutes || data.avg_prep_time_minutes || 15))

    if (data.bank_account) {
      setBankName(data.bank_account.bank_name || '')
      setAccountNumber(data.bank_account.account_number || '')
      setIfscCode(data.bank_account.ifsc_code || '')
      setAccountHolder(data.bank_account.account_holder_name || '')
      setUpiId(data.bank_account.upi_id || '')
    }

    if (data.operating_hours && Array.isArray(data.operating_hours) && data.operating_hours.length > 0) {
      const dayOrderMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
      }

      const mapped = defaultHours.map((def) => {
        const found = data.operating_hours.find((h) => {
          const dayName = h.day_name || (typeof h.day_of_week === 'number' ? dayOrderMap[h.day_of_week] : String(h.day_of_week || ''))
          return String(dayName || '').toLowerCase() === def.day.toLowerCase()
        })
        if (found) {
          const openState = found.is_closed !== undefined ? !found.is_closed : (found.is_open !== undefined ? !!found.is_open : true)
          const openStr = String(found.opening_time || found.open_time || '09:00')
          const closeStr = String(found.closing_time || found.close_time || '23:00')
          return {
            day: def.day,
            is_open: openState,
            open_time: openStr.substring(0, 5),
            close_time: closeStr.substring(0, 5),
          }
        }
        return def
      })
      setHours(mapped)
    }
  }, [liveRestData, cachedRest, user])

  // 1. Live Toggle Store
  const handleToggleStore = async (val) => {
    setToggleLoading(true)
    try {
      await restaurantApi.toggleOpen(val)
      setIsOpen(val)
      if (updateStoreState) updateStoreState({ is_open: val })
      toast.success(
        val ? 'Kitchen is Now Online' : 'Kitchen is Now Offline',
        val ? 'Ready to receive customer orders.' : 'Customer orders paused.'
      )
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update store state.')
    } finally {
      setToggleLoading(false)
    }
  }

  // 2. Save Profile
  const handleSaveProfile = async (e) => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.warning('Name required', 'Please enter restaurant name.')
      return
    }
    setProfileLoading(true)
    try {
      await restaurantApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        is_pure_veg: isPureVeg,
        avg_prep_time_minutes: Number(avgPrepTime) || 15,
      })
      if (refreshProfile) await refreshProfile()
      toast.success('Profile Saved', 'Restaurant profile details updated in database.')
      retry()
    } catch (err) {
      toast.error('Save Failed', err.message || 'Unable to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  // 3. Save Weekly Timings
  const handleSaveHours = async (e) => {
    e?.preventDefault()
    setHoursLoading(true)
    try {
      await restaurantApi.updateOperatingHours(hours)
      if (refreshProfile) await refreshProfile()
      toast.success('Timings Saved', 'Weekly kitchen schedule updated.')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save operating hours.')
    } finally {
      setHoursLoading(false)
    }
  }

  // Quick Copy Monday timings to all days
  const handleCopyMondayToAll = () => {
    const monday = hours[0]
    if (!monday) return
    const updated = hours.map((h) => ({
      ...h,
      is_open: monday.is_open,
      open_time: monday.open_time,
      close_time: monday.close_time,
    }))
    setHours(updated)
    toast.info('Copied', 'Monday timings applied to all 7 days.')
  }

  // 4. Save Bank Account
  const handleSaveBank = async (e) => {
    e?.preventDefault()
    if (!accountNumber || !ifscCode) {
      toast.warning('Details required', 'Please enter account number and IFSC code.')
      return
    }
    setBankLoading(true)
    try {
      await restaurantApi.updateBankAccount({
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder_name: accountHolder,
        upi_id: upiId,
      })
      if (refreshProfile) await refreshProfile()
      toast.success('Bank Details Saved', 'Payout account verified for weekly settlements.')
      retry()
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to save bank details.')
    } finally {
      setBankLoading(false)
    }
  }

  // 5. Change PIN
  const handleChangePin = async (e) => {
    e?.preventDefault()
    if (!newPin || newPin.length < 4) {
      toast.warning('Invalid PIN', 'PIN must be at least 4 digits.')
      return
    }
    if (newPin !== confirmPin) {
      toast.warning('Mismatch', 'New PIN and Confirm PIN do not match.')
      return
    }
    setSecurityLoading(true)
    try {
      await authApi.changePassword({
        current_password: currentPin,
        new_password: newPin,
        new_password_confirmation: confirmPin,
      })
      toast.success('PIN Changed', 'Your POS login PIN has been updated successfully.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update PIN.')
    } finally {
      setSecurityLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Store & Profile', icon: Store },
    { id: 'hours', label: 'Weekly Timings', icon: Clock },
    { id: 'bank', label: 'Bank Payouts', icon: Wallet },
    { id: 'security', label: 'Security & PIN', icon: Lock },
    { id: 'sound', label: 'Sound Alert', icon: Volume2 },
  ]

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2845D6]/10 text-[#2845D6] dark:text-blue-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span>Restaurant Settings & Operations</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            Manage kitchen timings, online status, bank payouts, and staff credentials.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => retry()}
          className="shrink-0"
        >
          Refresh Data
        </Button>
      </div>

      {/* Tabs Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto select-none no-scrollbar pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2845D6] text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {initialLoading && <LoadingSkeleton count={3} />}
      {loadError && (
        <ErrorState
          title="Error loading restaurant profile"
          message={loadError}
          onRetry={() => retry()}
        />
      )}

      {!initialLoading && (
        <>
          {/* 1. STORE & PROFILE TAB */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Live Online Status Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    LIVE ORDER ACCEPTANCE STATE
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {isOpen ? 'Kitchen is Currently ONLINE' : 'Kitchen is Currently OFFLINE'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                    {isOpen
                      ? 'Customers on Dastak can browse your menu and place new orders.'
                      : 'Your kitchen is paused and will not receive new incoming orders.'}
                  </p>
                </div>

                <Switch checked={isOpen} onChange={handleToggleStore} disabled={toggleLoading} />
              </div>

              {/* Profile Form Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  RESTAURANT PROFILE INFO
                </span>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Restaurant Name"
                      required
                      placeholder="e.g. Chay Chaupal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      icon={Building}
                    />
                    <Input
                      label="Registered Mobile"
                      required
                      placeholder="e.g. 9628717175"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      icon={Phone}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      type="email"
                      placeholder="e.g. info@restaurant.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Mail}
                    />
                    <Input
                      label="Address / Kitchen Location"
                      placeholder="e.g. Civil Lines, Kanpur"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      icon={MapPin}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Default Cooking / Prep Time (Minutes)"
                      type="number"
                      placeholder="15"
                      value={avgPrepTime}
                      onChange={(e) => setAvgPrepTime(e.target.value)}
                    />

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          100% Pure Vegetarian Outlet
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Highlights pure-veg badge on customer app
                        </p>
                      </div>
                      <Switch checked={isPureVeg} onChange={setIsPureVeg} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={profileLoading}
                      className="shadow-sm"
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. WEEKLY TIMINGS TAB */}
          {activeTab === 'hours' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    WEEKLY SCHEDULE (AUTO STORE OPEN/CLOSE)
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                    Set opening and closing hours for each day of the week.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Copy}
                  onClick={handleCopyMondayToAll}
                >
                  Apply Monday to All Days
                </Button>
              </div>

              <form onSubmit={handleSaveHours} className="space-y-3 divide-y divide-slate-100 dark:divide-slate-700/60">
                {hours.map((item, index) => (
                  <div
                    key={item.day}
                    className={`pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !item.is_open ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="w-32 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.day}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          item.is_open
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-md">
                      <input
                        type="time"
                        disabled={!item.is_open}
                        value={item.open_time || '08:00'}
                        onChange={(e) => {
                          const updated = [...hours]
                          updated[index].open_time = e.target.value
                          setHours(updated)
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2845D6] disabled:opacity-40"
                      />
                      <span className="text-xs text-slate-400 font-bold">to</span>
                      <input
                        type="time"
                        disabled={!item.is_open}
                        value={item.close_time || '23:00'}
                        onChange={(e) => {
                          const updated = [...hours]
                          updated[index].close_time = e.target.value
                          setHours(updated)
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2845D6] disabled:opacity-40"
                      />
                    </div>

                    <Switch
                      checked={item.is_open}
                      onChange={(val) => {
                        const updated = [...hours]
                        updated[index].is_open = val
                        setHours(updated)
                      }}
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={hoursLoading}
                    className="shadow-sm"
                  >
                    Save Timings
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 3. BANK & PAYOUTS TAB */}
          {activeTab === 'bank' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    SETTLEMENT BANK ACCOUNT
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                    Earnings are deposited directly to this account on weekly settlement cycles.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Account</span>
                </span>
              </div>

              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Account Holder Name"
                    required
                    placeholder="Account holder name"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                  />
                  <Input
                    label="Bank Name"
                    required
                    placeholder="Bank name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Account Number"
                    required
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <Input
                    label="IFSC Code"
                    required
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  />
                </div>

                <Input
                  label="UPI ID (Optional for Instant Transfers)"
                  placeholder="e.g. 9628717175@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={bankLoading}
                    className="shadow-sm"
                  >
                    Save Bank Details
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 4. SECURITY & PIN TAB */}
          {activeTab === 'security' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 max-w-xl">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  CHANGE POS LOGIN PIN / PASSWORD
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                  Update your quick 4-digit PIN for staff POS login.
                </p>
              </div>

              <form onSubmit={handleChangePin} className="space-y-4">
                <Input
                  label="Current Password / PIN"
                  type="password"
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="New 4-Digit PIN"
                    type="password"
                    maxLength={8}
                    placeholder="e.g. 2310"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New PIN"
                    type="password"
                    maxLength={8}
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={securityLoading}
                    className="shadow-sm"
                  >
                    Update PIN
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 5. SOUND & POS ALERTS TAB */}
          {activeTab === 'sound' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5 max-w-xl">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  KITCHEN AUDIO NOTIFICATIONS
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 font-medium">
                  Loud POS chime plays continuously when a new customer order arrives.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Order Arrival Audio Alert
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {soundEnabled ? 'Enabled — Chimes on new orders' : 'Muted — Visual notifications only'}
                  </p>
                </div>
                <Switch checked={soundEnabled} onChange={toggleSound} />
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="md"
                  icon={Play}
                  onClick={() => playChime()}
                  className="w-full sm:w-auto"
                >
                  Test Kitchen Chime Sound 🔊
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SettingsPage
