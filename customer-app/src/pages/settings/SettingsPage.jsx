import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  MapPin,
  Globe,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
  ShieldCheck,
  Phone,
  Smartphone,
  Edit3,
  KeyRound,
  Sparkles,
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
  const [platformConfig, setPlatformConfig] = useState(null)

  useEffect(() => {
    customerApi
      .getConfig()
      .then((res) => setPlatformConfig(res?.data || res))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      customerApi
        .getProfile()
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
    if (
      p.dietary_preference ||
      (Array.isArray(p.taste_preferences) && p.taste_preferences.length > 0)
    )
      score += 20
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
      toast.success(
        'Device Changed',
        'Current device session removed. You can now verify on this or a new device.'
      )
      navigate('/login')
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not revoke device session.')
    } finally {
      setChangeDeviceLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-32 sm:pb-36 px-0 sm:px-2">
      {/* 1. Header */}
      <div className="px-1 sm:px-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#113BD0] dark:text-blue-400 shrink-0" />
          <span>{lang === 'hi' ? 'ऐप सेटिंग्स और प्रोफाइल' : 'Settings & Profile'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'अपनी भाषा, सुरक्षा पिन, डिलीवरी पते और खाता प्रबंधित करें'
            : 'Manage language, security PIN, addresses, and account'}
        </p>
      </div>

      {/* 2. Account Profile Card */}
      <div
        onClick={() => isAuthenticated && navigate('/profile')}
        className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 transition-all ${
          isAuthenticated ? 'hover:border-[#113BD0]/40 cursor-pointer group' : ''
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0 group-hover:scale-105 transition-transform">
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
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {user?.name ||
                  (isAuthenticated
                    ? lang === 'hi'
                      ? 'प्रिय ग्राहक'
                      : 'Valued Customer'
                    : lang === 'hi'
                    ? 'अतिथि ग्राहक'
                    : 'Guest Customer')}
              </h3>
              {isAuthenticated && (
                <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Edit3 className="w-2.5 h-2.5" /> Edit
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.mobile
                ? `+91 ${user.mobile}`
                : lang === 'hi'
                ? 'प्राथमिकताएं एक्सेस करने के लिए साइन इन करें'
                : 'Sign in to access your profile'}
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
            className="font-bold text-xs shrink-0 rounded-xl px-3 py-2"
          >
            {t.login}
          </Button>
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#113BD0] group-hover:translate-x-0.5 transition-all shrink-0" />
        )}
      </div>

      {/* 3. Profile Completion Notification Banner (When < 100%) */}
      {isAuthenticated && completionPercentage < 100 && (
        <div
          onClick={() => navigate('/profile')}
          className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-orange-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-400 transition-all group"
        >
          {/* Circular/Square Percentage Badge */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-[#113BD0] text-white flex flex-col items-center justify-center text-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-sm sm:text-base font-black leading-none">
              {completionPercentage}%
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase font-bold text-blue-200 mt-0.5">
              Score
            </span>
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                Complete Your Profile
              </h4>
              <span className="text-[10px] font-bold text-[#113BD0] dark:text-blue-400 flex items-center gap-0.5 shrink-0">
                Finish <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
              Add birthday & food taste preferences for custom offers!
            </p>

            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-blue-200/70 dark:bg-blue-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Preferences List (Clean, Responsive Rows) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {/* Row 1: Personal Details & Food Taste */}
        {isAuthenticated && (
          <div
            onClick={() => navigate('/profile')}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#113BD0] dark:text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                    Personal Details & Taste
                  </h5>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                      completionPercentage === 100
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}
                  >
                    {completionPercentage}%
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                  DOB, Anniversary & Food Preferences
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#113BD0] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <span>Edit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Row 2: Saved Addresses */}
        <div
          onClick={() => navigate('/addresses')}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-slate-800 text-[#F97316] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                {t.savedAddresses || (lang === 'hi' ? 'सहेजे गए डिलीवरी पते' : 'Saved Addresses')}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                {activeAddress?.address ||
                  (lang === 'hi'
                    ? 'घर, ऑफिस और अन्य पते प्रबंधित करें'
                    : 'Manage home & office delivery locations')}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <span>Manage</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Row 3: Language Switcher */}
        <div
          onClick={toggleLanguage}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                {lang === 'hi' ? 'ऐप भाषा (Language)' : 'App Language (भाषा)'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                {lang === 'hi' ? 'वर्तमान में:' : 'Active:'}{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-bold">
                  {lang === 'en' ? 'English' : 'हिंदी'}
                </strong>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Row 4: Theme Switcher */}
        <div
          onClick={toggleTheme}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                {lang === 'hi' ? 'डार्क / लाइट थीम' : 'Dark / Light Theme'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                {lang === 'hi' ? 'वर्तमान:' : 'Current:'}{' '}
                <strong className="text-slate-700 dark:text-slate-200 font-bold">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </strong>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </div>
        </div>

        {/* Row 5: Change Device */}
        {isAuthenticated && (
          <div
            onClick={() => setShowChangeDeviceModal(true)}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  Change Device
                </h5>
                <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                  {lang === 'hi'
                    ? 'दूसरे फोन पर अकाउंट ट्रांसफर करें'
                    : 'Switch active session to another phone'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 sm:px-3 py-1.5 rounded-xl">
              <span>Switch</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
        )}

        {/* Row 6: 4-Digit Security PIN */}
        {isAuthenticated && (
          <div
            onClick={() => setShowPinModal(true)}
            className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#FF5200] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  4-Digit Security PIN
                </h5>
                <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                  {lang === 'hi'
                    ? 'फास्ट लॉगिन पिन बदलें'
                    : 'Manage your fast 4-digit login PIN'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-black text-[#FF5200] bg-orange-50 dark:bg-orange-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
              <span>Change</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Row 7: Support & Helpline */}
        {(() => {
          const supportPhone = platformConfig?.support_phone || '9005271986'
          const dialPhone = supportPhone.replace(/[^0-9+]/g, '')
          return (
            <div
              onClick={() => window.open(`tel:${dialPhone}`, '_self')}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 text-[#113BD0] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                    {lang === 'hi' ? 'ग्राहक सहायता' : 'Support Helpline'}
                  </h5>
                  <p className="text-slate-400 text-[11px] font-medium truncate mt-0.5">
                    24x7 Helpline: <strong className="text-slate-700 dark:text-slate-200 font-bold">{supportPhone}</strong>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* 5. Logout Button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" />
          <span>
            {t.logout || (lang === 'hi' ? 'खाते से लॉग आउट करें' : 'Sign Out of Account')}
          </span>
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
                className="flex-1 font-bold text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmChangeDevice}
                loading={changeDeviceLoading}
                className="flex-1 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
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
