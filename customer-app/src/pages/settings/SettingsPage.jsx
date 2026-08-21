import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  MapPin,
  Globe,
  Moon,
  Sun,
  Bell,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
  ShieldCheck,
  Phone,
  Smartphone,
  AlertTriangle,
  Edit3,
  Flame,
  Cake,
  KeyRound,
  Lock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useLocationContext } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import customerApi from '../../api/customer.api'
import ChangePinModal from '../../components/auth/ChangePinModal'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { lang, toggleLanguage, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout, changeDevice } = useAuth()
  const { activeAddress } = useLocationContext()
  const toast = useToast()

  const [showChangeDeviceModal, setShowChangeDeviceModal] = useState(false)
  const [changeDeviceLoading, setChangeDeviceLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      customerApi.getProfile()
        .then((res) => setProfileData(res?.data || res))
        .catch(() => {})
    }
  }, [isAuthenticated])

  const calculateCompletion = () => {
    const u = profileData || user
    if (!u) return 0
    if (u.profile_completion_percentage != null) return u.profile_completion_percentage
    
    let score = 0
    if (u.name) score += 15
    if (u.email) score += 15
    if (u.mobile) score += 15
    const p = u.customer_profile || {}
    if (p.gender) score += 10
    if (p.date_of_birth) score += 15
    if (p.anniversary_date) score += 10
    if (p.dietary_preference || (Array.isArray(p.taste_preferences) && p.taste_preferences.length > 0)) score += 20
    return Math.min(100, score)
  }

  const completionPercentage = calculateCompletion()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed Out', 'You have been logged out successfully.')
    navigate('/')
  }

  const handleConfirmChangeDevice = async () => {
    setChangeDeviceLoading(true)
    try {
      await changeDevice()
      setShowChangeDeviceModal(false)
      toast.success('Device Changed', 'Current device session removed. You can now verify on this or a new device.')
      navigate('/login')
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not revoke device session.')
    } finally {
      setChangeDeviceLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-[#113BD0] dark:text-blue-400" />
          <span>{lang === 'hi' ? 'ऐप सेटिंग्स और प्राथमिकताएं' : 'App Settings & Preferences'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'ऐप भाषा, थीम, डिलीवरी पते और खाता अनुकूलित करें'
            : 'Customize your app language, theme, delivery addresses, and account'}
        </p>
      </div>

      {/* 1. Account Profile Card (Clickable to /profile) */}
      <div
        onClick={() => isAuthenticated && navigate('/profile')}
        className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 transition-all ${
          isAuthenticated ? 'hover:border-[#113BD0]/40 cursor-pointer group' : ''
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
            {profileData?.avatar || user?.avatar ? (
              <img
                src={profileData?.avatar || user?.avatar}
                alt={user?.name || 'Customer'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.name ? user.name[0].toUpperCase() : 'C'}</span>
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {user?.name || (isAuthenticated ? (lang === 'hi' ? 'प्रिय ग्राहक' : 'Valued Customer') : (lang === 'hi' ? 'अतिथि ग्राहक' : 'Guest Customer'))}
              </h3>
              {isAuthenticated && (
                <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Edit
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {user?.mobile ? `+91 ${user.mobile}` : (lang === 'hi' ? 'सभी प्राथमिकताएं एक्सेस करने के लिए साइन इन करें' : 'Sign in to access all preferences')}
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <Button
            variant="primary"
            size="sm"
            icon={LogIn}
            onClick={(e) => {
              e.stopPropagation()
              navigate('/login?redirect=/settings')
            }}
            className="font-bold text-xs shrink-0"
          >
            {t.login}
          </Button>
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#113BD0] group-hover:translate-x-0.5 transition-all shrink-0" />
        )}
      </div>

      {/* Profile Completion Notification Banner (When < 100%) */}
      {isAuthenticated && completionPercentage < 100 && (
        <div
          onClick={() => navigate('/profile')}
          className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 shadow-xs flex items-stretch gap-3.5 cursor-pointer hover:border-blue-400 transition-all group"
        >
          {/* Full-Height Centered Percentage Box */}
          <div className="w-16 sm:w-20 shrink-0 self-stretch rounded-2xl bg-[#113BD0] text-white flex flex-col items-center justify-center p-2 text-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-lg sm:text-xl font-black leading-none">
              {completionPercentage}%
            </span>
            <span className="text-[9px] uppercase font-bold text-blue-200 mt-1">
              Score
            </span>
          </div>

          {/* Title, Subtitle & Progress Bar Column */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-2">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                  Complete Your Profile
                </h4>
                <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 flex items-center gap-0.5 shrink-0">
                  Finish <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                Add your birthday, anniversary & food taste preferences for custom dish curation & discounts!
              </p>
            </div>

            {/* Visual Progress Line */}
            <div className="w-full h-2 bg-blue-200/70 dark:bg-blue-900/60 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Preferences List */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Personal Details & Taste Preferences */}
        {isAuthenticated && (
          <div
            onClick={() => navigate('/profile')}
            className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#113BD0]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    Personal Details & Food Taste
                  </h5>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      completionPercentage === 100
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    {completionPercentage}%
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-medium">
                  DOB, Anniversary, Gender & Food Preferences
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>Edit Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
        {/* Language Switcher */}
        <div
          onClick={toggleLanguage}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'ऐप भाषा (Language)' : 'App Language (भाषा)'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'वर्तमान में:' : 'Currently:'} <strong>{lang === 'en' ? 'English' : 'हिंदी'}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
          </span>
        </div>

        {/* Theme Switcher */}
        <div
          onClick={toggleTheme}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'डार्क / लाइट थीम' : 'Dark / Light Theme'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'वर्तमान मोड:' : 'Current Mode:'} <strong>{isDark ? (lang === 'hi' ? 'डार्क मोड' : 'Dark Mode') : (lang === 'hi' ? 'लाइट मोड' : 'Light Mode')}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {lang === 'hi' ? 'बदलें' : 'Toggle'}
          </span>
        </div>

        {/* Saved Addresses */}
        <div
          onClick={() => navigate('/addresses')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#F97316]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {t.savedAddresses || (lang === 'hi' ? 'सहेजे गए डिलीवरी पते' : 'Saved Delivery Addresses')}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {activeAddress?.address || (lang === 'hi' ? 'घर और ऑफिस के पते प्रबंधित करें' : 'Manage home, work, and village addresses')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Change Device Feature */}
        {isAuthenticated && (
          <div
            onClick={() => setShowChangeDeviceModal(true)}
            className="p-4 flex items-center justify-between gap-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 rounded-2xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  Change Device
                </h5>
                <p className="text-slate-400 text-[11px] font-medium">
                  {lang === 'hi' ? 'दूसरे फोन या ब्राउज़र पर अकाउंट ट्रांसफर करें' : 'Switch active session to another phone or device'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl">
              Change Device
            </span>
          </div>
        )}

        {/* 4-Digit Security PIN */}
        {isAuthenticated && (
          <div
            onClick={() => setShowPinModal(true)}
            className="p-4 flex items-center justify-between gap-3 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-2xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#FF5200]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  4-Digit Security PIN
                </h5>
                <p className="text-slate-400 text-[11px] font-medium">
                  {lang === 'hi' ? 'लॉगिन पिन बदलें या प्रबंधित करें' : 'Change or manage your fast login PIN'}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#FF5200] bg-orange-50 dark:bg-orange-950/50 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span>Change PIN</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* Support & Helpline */}
        <div
          onClick={() => window.open('tel:1800123456', '_blank')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#113BD0]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'ग्राहक सहायता हेल्पलाइन' : 'Customer Support Helpline'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? '24x7 टोल-फ्री:' : '24x7 Toll-Free:'} <strong>1800-123-456</strong>
              </p>
            </div>
          </div>
          <Phone className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout || (lang === 'hi' ? 'खाते से लॉग आउट करें' : 'Sign Out of Account')}</span>
        </button>
      )}

      {/* Change Device Confirmation Modal */}
      {showChangeDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Change Device?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Your current device session will be removed. You will need to verify your mobile number again on this or another device.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowChangeDeviceModal(false)}
                disabled={changeDeviceLoading}
                className="flex-1 font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmChangeDevice}
                loading={changeDeviceLoading}
                className="flex-1 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Change PIN Popup */}
      <ChangePinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </div>
  )
}

export default SettingsPage
