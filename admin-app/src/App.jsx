import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'

import AdminLayout from './components/layout/AdminLayout'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'

import Dashboard from './pages/dashboard/Dashboard'
import RestaurantList from './pages/restaurants/RestaurantList'
import RestaurantDetails from './pages/restaurants/RestaurantDetails'
import OrderList from './pages/orders/OrderList'
import DeliveryBoyList from './pages/deliveryBoys/DeliveryBoyList'
import DeliveryBoyDetails from './pages/deliveryBoys/DeliveryBoyDetails'
import DeliveryBoyIdCard from './pages/deliveryBoys/DeliveryBoyIdCard'
import CustomerList from './pages/customers/CustomerList'
import CustomerDetails from './pages/customers/CustomerDetails'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import CouponList from './pages/marketing/CouponList'
import FoodCategoriesPage from './pages/marketing/FoodCategoriesPage'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import SupportTickets from './pages/support/SupportTickets'
import SettingsPage from './pages/settings/SettingsPage'
import SystemLogDashboard from './pages/systemLog/SystemLogDashboard'

import { PwaInstallModal } from './components/pwa/PwaInstallModal'
import { usePwaUpdate } from './hooks/usePwaUpdate'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

const PwaController = () => {
  usePwaUpdate()
  return (
    <PwaInstallModal
      appName="Dastak Admin Portal"
      appRole="Multi-Vendor Operations & Administration"
      iconSrc="/pwa-512x512.png"
      accentColor="bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
      accentBadge="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    />
  )
}

export const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <PwaController />
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Admin Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="restaurants" element={<RestaurantList />} />
                <Route path="restaurants/:id" element={<RestaurantDetails />} />
                <Route path="delivery-boys" element={<DeliveryBoyList />} />
                <Route path="delivery-boys/:id" element={<DeliveryBoyDetails />} />
                <Route path="delivery-boys/:id/id-card" element={<DeliveryBoyIdCard />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="marketing" element={<CouponList />} />
                <Route path="food-categories" element={<FoodCategoriesPage />} />
                <Route path="reports" element={<ReportsDashboard />} />
                <Route path="system-logs" element={<SystemLogDashboard />} />
                <Route path="support" element={<SupportTickets />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App