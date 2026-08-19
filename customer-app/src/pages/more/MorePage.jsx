import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  Settings as SettingsIcon,
  MapPin,
  Globe,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
  User,
  Phone,
  ShieldCheck,
  Menu,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { useLocationContext } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'

export const MorePage = () => {
  const navigate = useNavigate()
  const { lang, toggleLanguage, t } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const { activeAddress } = useLocationContext()
  const toast = useToast()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed Out', 'You have been logged out successfully.')
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Menu className="w-7 h-7 text-[#2845D6] dark:text-blue-400" />
          <span>{lang === 'hi' ? 'अन्य विकल्प' : 'More Options'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {lang === 'hi'
            ? 'खर्च रिपोर्ट, ऐप सेटिंग्स, प्राथमिकताएं और सहायता प्राप्त करें'
            : 'Access spending reports, app settings, preferences, and support'}
        </p>
      </div>

      {/* User Profile Summary Card */}
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
              {user?.mobile ? `+91 ${user.mobile}` : (lang === 'hi' ? 'सभी सुविधाएं एक्सेस करने के लिए साइन इन करें' : 'Sign in to access all features')}
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <Button
            variant="primary"
            size="sm"
            icon={LogIn}
            onClick={() => navigate('/login?redirect=/more')}
            className="font-bold text-xs shrink-0"
          >
            {t.login}
          </Button>
        ) : (
          <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-xl">
            {lang === 'hi' ? 'सक्रिय' : 'Active'}
          </span>
        )}
      </div>

      {/* Main Options Menu Group */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* 1. Report & Activity */}
        <div
          onClick={() => navigate('/reports')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#2845D6] dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'खर्च और गतिविधि रिपोर्ट' : 'Spending & Activity Reports'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'मासिक खर्च, बिलिंग इतिहास और ऑर्डर का सारांश' : 'Monthly expenses, billing history, and order breakdown'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* 2. Settings */}
        <div
          onClick={() => navigate('/settings')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 group-hover:scale-110 transition-transform">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'ऐप सेटिंग्स और प्राथमिकताएं' : 'App Settings & Preferences (सेटिंग)'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'प्रोफ़ाइल, डिलीवरी पते और खाता नियंत्रण' : 'Profile, delivery addresses, and account controls'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* 3. Saved Addresses */}
        <div
          onClick={() => navigate('/addresses')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#F97316] group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {t.savedAddresses || (lang === 'hi' ? 'सहेजे गए डिलीवरी पते' : 'Saved Delivery Addresses')}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {activeAddress?.address || (lang === 'hi' ? 'घर और ऑफिस के पते प्रबंधित करें' : 'Manage home and work addresses')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* 4. Language Switcher */}
        <div
          onClick={toggleLanguage}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'भाषा (Language)' : 'Language (भाषा)'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'वर्तमान:' : 'Current:'} <strong>{lang === 'en' ? 'English' : 'हिंदी'}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#2845D6] dark:text-blue-400 bg-blue-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
          </span>
        </div>

        {/* 5. Theme Switcher */}
        <div
          onClick={toggleTheme}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-slate-800 text-amber-600">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? 'थीम और रंगरूप' : 'Appearance'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'वर्तमान:' : 'Current:'} <strong>{isDark ? (lang === 'hi' ? 'डार्क मोड' : 'Dark Mode') : (lang === 'hi' ? 'लाइट मोड' : 'Light Mode')}</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {lang === 'hi' ? 'बदलें' : 'Toggle'}
          </span>
        </div>

        {/* 6. Support Helpline */}
        <div
          onClick={() => window.open('tel:1800123456', '_blank')}
          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#2845D6]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'hi' ? '24x7 ग्राहक सहायता' : '24x7 Customer Support'}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'टोल-फ्री हेल्पलाइन: 1800-123-456' : 'Toll-Free Helpline: 1800-123-456'}
              </p>
            </div>
          </div>
          <Phone className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* Logout Button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout || (lang === 'hi' ? 'लॉग आउट करें' : 'Sign Out')}</span>
        </button>
      )}
    </div>
  )
}

export default MorePage
