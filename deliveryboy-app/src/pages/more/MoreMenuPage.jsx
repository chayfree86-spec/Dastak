import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Banknote,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Bike,
  Star,
  PhoneCall,
  FileText,
  Volume2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/formatters'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export const MoreMenuPage = () => {
  const navigate = useNavigate()
  const { user, riderProfile, logout } = useAuth()
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const pendingCod = riderProfile?.pending_cod_amount || 0
  const rating = Number(riderProfile?.rating || 4.9).toFixed(1)

  const menuSections = [
    {
      title: 'FLEET OPERATIONS',
      items: [
        {
          label: 'COD Cash Ledger',
          desc: 'Collected cash in hand & deposit history',
          icon: Banknote,
          badge: pendingCod > 0 ? formatCurrency(pendingCod) : null,
          badgeColor: 'bg-amber-500 text-white',
          onClick: () => navigate('/cod'),
        },
        {
          label: 'Rider Profile & Vehicle',
          desc: 'Vehicle number, license & account status',
          icon: User,
          badge: 'Verified',
          badgeColor: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
          onClick: () => navigate('/profile'),
        },
      ],
    },
    {
      title: 'APP & SUPPORT',
      items: [
        {
          label: 'App Settings',
          desc: 'Dark theme, audio tone & change password',
          icon: Settings,
          onClick: () => navigate('/settings'),
        },
        {
          label: 'Fleet Manager Helpline',
          desc: 'Emergency contact & dispatch support',
          icon: PhoneCall,
          onClick: () => (window.location.href = 'tel:+919876543210'),
        },
      ],
    },
  ]

  const handleConfirmLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setLogoutLoading(false)
      setLogoutModalOpen(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Profile Banner */}
      <div
        onClick={() => navigate('/profile')}
        className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-[#113BD0]/40 transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#113BD0] to-[#F97316] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
            {user?.name?.charAt(0) || 'R'}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'Rider Name'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {user?.mobile || 'Registered Rider'} • ID #{user?.id || 7}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 2. Menu Navigation Sections */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
            {section.title}
          </h4>

          <div className="rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
            {section.items.map((item, itemIdx) => {
              const Icon = item.icon
              return (
                <div
                  key={itemIdx}
                  onClick={item.onClick}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {item.label}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* 3. Logout Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Delivery Fleet</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out from Fleet?"
        message="You will not receive new order assignments until you sign back in."
        confirmText="Yes, Sign Out"
        cancelText="Stay Active"
        type="danger"
        loading={logoutLoading}
      />
    </div>
  )
}

export default MoreMenuPage
