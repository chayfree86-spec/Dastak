import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SoundProvider } from './context/SoundContext'
import { ThemeProvider } from './context/ThemeContext'
import PartnerLayout from './components/layout/PartnerLayout'
import Login from './pages/auth/Login'
import NewOrders from './pages/orders/NewOrders'
import OrdersList from './pages/orders/OrdersList'
import MenuPage from './pages/menu/MenuPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettlementsPage from './pages/settlements/SettlementsPage'
import SettingsPage from './pages/settings/SettingsPage'

import { PwaInstallModal } from './components/pwa/PwaInstallModal'
import { usePwaUpdate } from './hooks/usePwaUpdate'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  if (isAuthenticated) {
    return <Navigate to="/new-orders" replace />
  }

  return children
}

const PwaController = () => {
  usePwaUpdate()
  return (
    <PwaInstallModal
      appName="Dastak Restaurant Partner"
      appRole="Live Order Management & Kitchen Display System"
      iconSrc="/pwa-512x512.png"
      accentColor="bg-gradient-to-r from-[#113BD0] via-[#7C3AED] to-[#FF5200] hover:opacity-95 text-white shadow-lg shadow-indigo-600/35"
      accentBadge="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-950/40 dark:to-orange-950/40 text-slate-900 dark:text-slate-100 border-indigo-200 dark:border-indigo-500/20"
    />
  )
}

export function App() {
  React.useEffect(() => {
    const splashTimer = setTimeout(() => {
      if (typeof window.dismissSplash === 'function') {
        window.dismissSplash()
      }
    }, 1100)
    return () => clearTimeout(splashTimer)
  }, [])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SoundProvider>
              <PwaController />
              <Routes>
                {/* Public Auth */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />

                {/* Protected Restaurant Operations */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <PartnerLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/new-orders" replace />} />
                  <Route path="new-orders" element={<NewOrders />} />
                  <Route path="orders" element={<OrdersList />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settlements" element={<SettlementsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SoundProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
