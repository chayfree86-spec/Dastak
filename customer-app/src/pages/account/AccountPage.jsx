import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  MapPin,
  Clock,
  Globe,
  HelpCircle,
  LogOut,
  LogIn,
  ChevronRight,
  ShieldCheck,
  Phone,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useLocationContext } from '../../context/LocationContext'
import Button from '../../components/common/Button'

export const AccountPage = () => {
  const navigate = useNavigate()
  const { lang, toggleLanguage, t } = useLanguage()
  const { user, isAuthenticated, logout } = useAuth()
  const { activeAddress } = useLocationContext()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t.myProfile}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {lang === 'hi'
            ? 'अपना खाता, पते और ऐप प्राथमिकताएं प्रबंधित करें'
            : 'Manage your account, addresses, and app preferences'}
        </p>
      </div>

      {/* User Info Card */}
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
              {user?.mobile ? `+91 ${user.mobile}` : (lang === 'hi' ? 'ऑर्डर सिंक करने के लिए साइन इन करें' : 'Sign in to sync your orders')}
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={LogIn}
            onClick={() => navigate('/login?redirect=/account')}
            className="font-bold text-xs shrink-0"
          >
            {t.login}
          </Button>
        )}
      </div>

      {/* Navigation Options List */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Saved Addresses */}
        <div
          onClick={() => navigate('/addresses')}
          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-slate-800 text-[#F97316]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {t.savedAddresses}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {activeAddress?.address || (lang === 'hi' ? 'घर और ऑफिस के पते प्रबंधित करें' : 'Manage home and work addresses')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Order History */}
        <div
          onClick={() => navigate('/orders')}
          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#2845D6]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {t.orderHistory}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'पुराने फूड ऑर्डर्स और रसीदें' : 'Past food deliveries and receipts'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Language Switcher */}
        <div
          onClick={toggleLanguage}
          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {t.language}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'वर्तमान:' : 'Current:'} <strong>{lang === 'en' ? 'English' : 'हिंदी'}</strong> ({lang === 'hi' ? 'बदलने के लिए टैप करें' : 'Tap to change'})
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#2845D6] dark:text-blue-400">
            {lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
          </span>
        </div>

        {/* Support Helpline */}
        <div
          onClick={() => window.open('tel:1800123456', '_blank')}
          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-black text-slate-900 dark:text-slate-100">
                {t.helpSupport}
              </h5>
              <p className="text-slate-400 text-[11px] font-medium">
                {lang === 'hi' ? 'टोल-फ्री ग्राहक सेवा: 1800-123-456' : 'Toll-Free Customer Support: 1800-123-456'}
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
          className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      )}
    </div>
  )
}

export default AccountPage
