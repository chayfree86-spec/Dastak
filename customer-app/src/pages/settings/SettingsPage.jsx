import React, { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useLocationContext } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { lang, toggleLanguage, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout, changeDevice } = useAuth()
  const { activeAddress } = useLocationContext()
  const toast = useToast()

  const [showChangeDeviceModal, setShowChangeDeviceModal] = useState(false)
  const [changeDeviceLoading, setChangeDeviceLoading] = useState(false)

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-[#2845D6] dark:text-blue-400" />
          <span>{lang === 'hi' ? 'ऐप सेटिंग्स और प्राथमिकताएं' : 'App Settings & Preferences'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'ऐप भाषा, थीम, डिलीवरी पते और खाता अनुकूलित करें'
            : 'Customize your app language, theme, delivery addresses, and account'}
        </p>
      </div>

      {/* 1. Account Profile Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2845D6] to-[#F97316] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'C'}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {user?.name || (isAuthenticated ? (lang === 'hi' ? 'प्रिय ग्राहक' : 'Valued Customer') : (lang === 'hi' ? 'अतिथि ग्राहक' : 'Guest Customer'))}
            </h3>
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
            onClick={() => navigate('/login?redirect=/settings')}
            className="font-bold text-xs shrink-0"
          >
            {t.login}
          </Button>
        ) : (
          <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-xl">
            {lang === 'hi' ? 'सक्रिय डिवाइस' : 'Active Device'}
          </span>
        )}
      </div>

      {/* 2. Preferences List */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
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
          <span className="text-xs font-black text-[#2845D6] dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
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

        {/* Support & Helpline */}
        <div
          onClick={() => window.open('tel:1800123456', '_blank')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#2845D6]">
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
    </div>
  )
}

export default SettingsPage
