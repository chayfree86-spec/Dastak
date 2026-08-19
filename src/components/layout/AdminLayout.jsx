import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useAuth } from '../../context/AuthContext'
import { AlertCircle, Menu } from 'lucide-react'

const routeTitles = {
  '/dashboard': 'Operational Dashboard',
  '/orders': 'Live Orders Management',
  '/restaurants': 'Restaurants Directory',
  '/delivery-boys': 'Delivery Boy Fleet',
  '/customers': 'Customer Directory',
  '/finance': 'Financial Overview & Settlements',
  '/marketing': 'Marketing & Coupons',
  '/reports': 'Analytics & Reports',
  '/support': 'Customer & Partner Support',
  '/settings': 'Platform Settings',
}

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionExpired, setSessionExpired, logout } = useAuth()

  // Find matching title
  const currentPath = '/' + location.pathname.split('/')[1]
  const pageTitle = routeTitles[currentPath] || 'Dastak Admin'

  const handleSessionLoginRedirect = () => {
    setSessionExpired(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] flex text-slate-900 dark:text-slate-100">
      {/* Responsive Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          title={pageTitle}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full">
          <Outlet />
        </main>
      </div>

      {/* Floating Center Hamburger Menu Pill for Mobile Only (Hidden on Desktop) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-[#2845D6] text-white shadow-2xl shadow-[#2845D6]/40 border border-white/20 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5 text-white" />
        <span className="text-xs font-bold tracking-wide uppercase text-white">Menu</span>
      </button>

      {/* Session Expired Modal */}
      <Modal isOpen={sessionExpired} onClose={handleSessionLoginRedirect} maxWidth="max-w-sm" showClose={false}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Session Expired</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
            Your login session has expired. Please sign in again to continue managing operations.
          </p>
          <Button variant="primary" className="w-full" onClick={handleSessionLoginRedirect}>
            Sign In Again
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminLayout
