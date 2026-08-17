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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-[#2845D6] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Dastak Kitchen...</span>
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

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SoundProvider>
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
