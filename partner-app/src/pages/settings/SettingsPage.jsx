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
  Volume1,
  VolumeX,
  Music,
  Bell,
  Upload,
  Trash2,
  Square,
  Check,
  FileAudio,
  HelpCircle,
  MessageSquare,
  Globe,
  Headphones,
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
  const { user, restaurant: cachedRest, refreshProfile, updateStoreState, updateRestaurant } = useAuth()
  const {
    soundEnabled,
    soundType,
    customSoundName,
    hasCustomSound,
    volume,
    isPlaying,
    toggleSound,
    playChime,
    stopChime,
    setSoundType,
    setCustomAudio,
    removeCustomAudio,
    setVolume,
  } = useSound()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('general')
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [platformConfig, setPlatformConfig] = useState(null)

  useEffect(() => {
    restaurantApi.getConfig?.().then((res) => {
      setPlatformConfig(res?.data?.data || res?.data || null)
    }).catch(() => {})
  }, [])

  // Fetch real restaurant profile from backend
  const {
    data: liveRestData,
    loading: initialLoading,
    error: loadError,
    retry,
  } = useApi(() => restaurantApi.getRestaurant(), [])

  const parseBool = (v) => v === true || v === 1 || v === '1' || v === 'true'

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

    setIsOpen(parseBool(data.is_open))
    setName(data.name || '')
    setEmail(data.email || '')
    setPhone(data.phone || data.mobile || user?.mobile || '')
    setAddress(data.address_line1 || data.address || '')
    setIsPureVeg(parseBool(data.is_pure_veg))
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

  // 2. Live Toggle Pure Veg Switch
  const handleTogglePureVeg = async (val) => {
    setIsPureVeg(val)
    try {
      await restaurantApi.updateProfile({
        name: name.trim() || 'Chay Chaupal',
        is_pure_veg: val,
      })
      if (updateRestaurant) updateRestaurant({ is_pure_veg: val })
      if (refreshProfile) await refreshProfile()
      toast.success(
        val ? 'Pure Veg Mode Enabled' : 'Standard Menu Mode Enabled',
        val ? '100% Pure Veg badge is now active for your outlet.' : 'Pure veg outlet badge removed.'
      )
    } catch (err) {
      toast.error('Failed', err.message || 'Unable to update pure veg status.')
      setIsPureVeg(!val)
    }
  }

  // 3. Save Profile
  const handleSaveProfile = async (e) => {
    e?.preventDefault()
    if (!name.trim()) {
      toast.warning('Name required', 'Please enter restaurant name.')
      return
    }
    setProfileLoading(true)
    try {
      const res = await restaurantApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        is_pure_veg: !!isPureVeg,
        avg_prep_time_minutes: Number(avgPrepTime) || 15,
      })
      const updated = res.data?.data || res.data
      if (updated) {
        setIsPureVeg(parseBool(updated.is_pure_veg))
        if (updateRestaurant) updateRestaurant(updated)
      }
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
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
  ]

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#113BD0]/10 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span>Restaurant Settings & Operations</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            Manage kitchen timings, online status, bank payouts, and staff credentials.
          </p>
        </div>
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
                  ? 'bg-[#113BD0] text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20'
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

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          100% Pure Vegetarian Outlet
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Highlights pure-veg badge on customer app
                        </p>
                      </div>
                      <Switch checked={isPureVeg} onChange={handleTogglePureVeg} />
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

              {/* Quick Help & Support Footer in Profile Tab */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-200/50 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-xs text-slate-900 dark:text-slate-100 block">
                      Need help with orders, menu updates or bank settlements?
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Our partner operations team is available 24x7 via Call, WhatsApp & Email.
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('support')}
                  className="font-bold text-xs shrink-0"
                >
                  Open Support Hub ↗
                </Button>
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
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#113BD0] disabled:opacity-40"
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
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#113BD0] disabled:opacity-40"
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
            <div className="space-y-6 max-w-2xl">
              {/* Card 1: Master Audio Alert Toggle */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                      KITCHEN AUDIO NOTIFICATIONS
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Plays a loud chime or your custom ringtone whenever a new order is received.
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#113BD0] dark:text-blue-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                      Order Arrival Audio Alert
                    </span>
                    <p className="text-xs text-slate-400">
                      {soundEnabled ? 'Active — Automatically chimes on incoming orders' : 'Muted — Visual dashboard alerts only'}
                    </p>
                  </div>
                  <Switch checked={soundEnabled} onChange={toggleSound} />
                </div>
              </div>

              {/* Card 2: Preset Tone & Custom Audio Selection */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    CHOOSE ALERT TONE / RINGTONE
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Select a built-in kitchen chime or upload your own custom sound file.
                  </p>
                </div>

                {/* Sound Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Preset 1: Crystal Bell (Default) */}
                  <div
                    onClick={() => setSoundType('default')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'default'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#113BD0] dark:text-blue-300 flex items-center justify-center font-black shrink-0">
                        🔔
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Crystal Bell
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Crisp dual-frequency ring (Default)
                        </span>
                      </div>
                    </div>
                    {soundType === 'default' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Preset 2: Kitchen Buzzer */}
                  <div
                    onClick={() => setSoundType('buzzer')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'buzzer'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
                        🛎️
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Kitchen Buzzer
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Urgent loud kitchen attention pulse
                        </span>
                      </div>
                    </div>
                    {soundType === 'buzzer' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Preset 3: Digital POS Horn */}
                  <div
                    onClick={() => setSoundType('digital')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'digital'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black shrink-0">
                        🎺
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Digital POS Horn
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          High-energy rhythmic tri-tone
                        </span>
                      </div>
                    </div>
                    {soundType === 'digital' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Preset 4: Melodic Marimba */}
                  <div
                    onClick={() => setSoundType('marimba')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'marimba'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-black shrink-0">
                        🎵
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Melodic Chime
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Warm acoustic wooden chime
                        </span>
                      </div>
                    </div>
                    {soundType === 'marimba' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Preset 5: Announcement Chime (MP3) */}
                  <div
                    onClick={() => setSoundType('announcement')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'announcement'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 flex items-center justify-center font-black shrink-0">
                        📢
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Announcement Chime (MP3)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Studio announcement broadcast chime
                        </span>
                      </div>
                    </div>
                    {soundType === 'announcement' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Preset 6: Urgent Warning Siren (MP3) */}
                  <div
                    onClick={() => setSoundType('warning')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      soundType === 'warning'
                        ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center font-black shrink-0">
                        🚨
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">
                          Warning Alert Siren (MP3)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Loud high-priority kitchen alert
                        </span>
                      </div>
                    </div>
                    {soundType === 'warning' && (
                      <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Audio Upload Section */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2">
                    CUSTOM RINGTONE FILE (ALL AUDIO FORMATS SUPPORTED)
                  </span>

                  {hasCustomSound ? (
                    <div
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                        soundType === 'custom'
                          ? 'border-[#113BD0] bg-blue-50/50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}
                    >
                      <div
                        onClick={() => setSoundType('custom')}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
                          <FileAudio className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                              {customSoundName || 'Custom Audio Alert'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[#113BD0] dark:text-blue-300 text-[9px] font-black uppercase tracking-wider">
                              ACTIVE CUSTOM SOUND
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Loaded from local file • Ready for order arrival alerts
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {soundType === 'custom' && (
                          <div className="w-5 h-5 rounded-full bg-[#113BD0] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            removeCustomAudio()
                            toast.info('Custom Sound Removed', 'Reverted to default Crystal Bell.')
                          }}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Remove custom audio and revert to default"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Upload Dropzone / Button */}
                  <div className="mt-3">
                    <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#113BD0] dark:hover:border-blue-500 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac,.webm"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          if (file.size > 15 * 1024 * 1024) {
                            toast.error('File Too Large', 'Please select an audio file under 15MB.')
                            return
                          }

                          setUploadingAudio(true)
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const base64 = event.target?.result
                            if (base64) {
                              setCustomAudio(base64, file.name)
                              toast.success('Custom Sound Loaded!', `"${file.name}" is now set as your order chime.`)
                            }
                            setUploadingAudio(false)
                          }
                          reader.onerror = () => {
                            toast.error('Read Failed', 'Could not read audio file.')
                            setUploadingAudio(false)
                          }
                          reader.readAsDataURL(file)
                        }}
                      />

                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>

                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5">
                        {uploadingAudio ? 'Uploading & Processing Audio...' : 'Click to Browse or Drag & Drop Custom Audio'}
                      </span>

                      <p className="text-[11px] text-slate-400 mt-1">
                        Supported formats: <strong className="font-semibold text-slate-600 dark:text-slate-300">MP3, WAV, OGG, AAC, M4A, FLAC, WebM</strong> (Up to 15MB)
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 3: Volume Slider & Live Preview Test */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    VOLUME & LIVE AUDIO PREVIEW
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Adjust kitchen volume level and test audio playback.
                  </p>
                </div>

                {/* Volume Level Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Volume1 className="w-4 h-4 text-slate-400" />
                      <span>Alert Volume</span>
                    </span>
                    <span className="font-black text-[#113BD0] dark:text-blue-400">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={Math.round(volume * 100)}
                    onChange={(e) => setVolume(Number(e.target.value) / 100)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#113BD0]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                    <span>Soft (10%)</span>
                    <span>Standard (80%)</span>
                    <span>Loud POS (100%)</span>
                  </div>
                </div>

                {/* Test Audio Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant={isPlaying ? 'danger' : 'primary'}
                    size="lg"
                    icon={isPlaying ? Square : Play}
                    onClick={() => {
                      if (isPlaying) {
                        stopChime()
                      } else {
                        playChime()
                      }
                    }}
                    className="shadow-md flex-1"
                  >
                    {isPlaying ? 'Stop Playing Sound ⏹️' : 'Test Active Sound Alert 🔊'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      removeCustomAudio()
                      setVolume(0.8)
                      toast.success('Reset Complete', 'Sound settings restored to default Crystal Bell at 80% volume.')
                    }}
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 6. HELP & SUPPORT TAB */}
          {activeTab === 'support' && (() => {
            const partnerPhone = platformConfig?.partner_support_phone || platformConfig?.support_phone || '9005271986'
            const commonPhone = platformConfig?.support_phone || '9005271986'
            const whatsappPhone = platformConfig?.support_whatsapp || partnerPhone
            const supportEmail = platformConfig?.support_email || 'support@dastakdelivery.com'

            const cleanCall = partnerPhone.replace(/[^0-9+]/g, '')
            const cleanWhatsapp = whatsappPhone.replace(/[^0-9]/g, '')

            return (
              <div className="space-y-6">
                {/* Main Support Header Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#113BD0] to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Headphones className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                          Partner Helpdesk & Merchant Support
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          24x7 Dedicated assistance for kitchen operations, rider dispatch & bank settlements.
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Support Team Online
                    </span>
                  </div>

                  {/* 3 Channels Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Partner Call Helpline */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between gap-3 group hover:border-[#113BD0]/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#113BD0] dark:text-blue-400 flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          Direct Line
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Partner Helpline
                        </span>
                        <span className="font-black text-base text-slate-900 dark:text-slate-100 block mt-0.5">
                          {partnerPhone}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Call directly for live order queries and delivery fleet dispatch.
                        </p>
                      </div>
                      <a
                        href={`tel:${cleanCall}`}
                        className="w-full py-2 px-3 rounded-xl bg-[#113BD0] hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Partner Support</span>
                      </a>
                    </div>

                    {/* 2. WhatsApp Merchant Support */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between gap-3 group hover:border-emerald-500/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          Instant Chat
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Merchant WhatsApp
                        </span>
                        <span className="font-black text-base text-slate-900 dark:text-slate-100 block mt-0.5">
                          +91 {whatsappPhone}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Share screenshots of bills, payout receipts, or menu updates.
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/${cleanWhatsapp.startsWith('91') ? cleanWhatsapp : '91' + cleanWhatsapp}?text=Hello%20Dastak%20Partner%20Support,%20I%20am%20a%20registered%20restaurant%20partner%20and%20need%20assistance.`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>

                    {/* 3. Official Email Support */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between gap-3 group hover:border-purple-500/40 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                          Official Desk
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Official Email
                        </span>
                        <span className="font-black text-base text-slate-900 dark:text-slate-100 block mt-0.5 truncate">
                          {supportEmail}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          For GST invoices, contractual inquiries, and onboarding support.
                        </p>
                      </div>
                      <a
                        href={`mailto:${supportEmail}?subject=Merchant%20Support%20Request%20-%20${encodeURIComponent(name || 'Partner')}`}
                        className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Email</span>
                      </a>
                    </div>
                  </div>

                  {/* Global Common Toll-Free Helpline Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-blue-200/60 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#113BD0] text-white flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          Global Common Helpline: {commonPhone}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Central toll-free emergency operations line accessible across all Dastak partner hubs.
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${commonPhone.replace(/[^0-9+]/g, '')}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shrink-0 hover:opacity-90 transition-opacity"
                    >
                      Call Global Hub
                    </a>
                  </div>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}

export default SettingsPage
