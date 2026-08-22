import React, { useState, useEffect } from 'react'
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
  Flame,
  Cake,
  Edit3,
  CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useLocationContext } from '../../context/LocationContext'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import customerApi from '../../api/customer.api'

export const AccountPage = () => {
  const navigate = useNavigate()
  const { lang, toggleLanguage, t } = useLanguage()
  const { user, isAuthenticated, logout } = useAuth()
  const { activeAddress } = useLocationContext()
  const toast = useToast()
  const [profileData, setProfileData] = useState(null)
  const [platformConfig, setPlatformConfig] = useState(null)

  useEffect(() => {
    customerApi.getConfig()
      .then((res) => setPlatformConfig(res?.data || res))
      .catch(() => {})
  }, [])

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
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

      {/* User Info Card (Clickable to /profile) */}
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
              {user?.mobile ? `+91 ${user.mobile}` : (lang === 'hi' ? 'ऑर्डर सिंक करने के लिए साइन इन करें' : 'Sign in to sync your orders')}
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
              navigate('/login?redirect=/account')
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
          className="p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:border-blue-400 transition-all group"
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#113BD0] text-white">
                {completionPercentage}% Complete
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Complete Your Profile
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Add your birthday, anniversary & food taste preferences for custom dish curation & birthday discounts!
            </p>
            {/* Visual Progress Line */}
            <div className="w-full max-w-xs h-1.5 bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="h-8 px-3 rounded-xl bg-[#113BD0] text-white font-bold text-xs flex items-center gap-1 shrink-0 group-hover:bg-[#1E3A8A] transition-colors shadow-xs"
          >
            <span>Finish Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Options List */}
      <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Personal Details & Taste Preferences */}
        {isAuthenticated && (
          <div
            onClick={() => navigate('/profile')}
            className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#113BD0]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-black text-slate-900 dark:text-slate-100">
                    Personal Details & Food Taste
                  </h5>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                      completionPercentage === 100
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    {completionPercentage}%
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-medium">
                  DOB, Anniversary, Gender & Flavors
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        )}
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
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#113BD0]">
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
          <span className="text-xs font-black text-[#113BD0] dark:text-blue-400">
            {lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
          </span>
        </div>

        {/* Support Helpline */}
        {(() => {
          const supportPhone = platformConfig?.support_phone || '9005271986'
          const dialPhone = supportPhone.replace(/[^0-9+]/g, '')
          return (
            <div
              onClick={() => window.open(`tel:${dialPhone}`, '_self')}
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
                    {lang === 'hi' ? 'ग्राहक सेवा हेल्पलाइन:' : 'Customer Support Helpline:'} <strong>{supportPhone}</strong>
                  </p>
                </div>
              </div>
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
          )
        })()}
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
