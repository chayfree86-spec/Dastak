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
import CustomerList from './pages/customers/CustomerList'
import CustomerDetails from './pages/customers/CustomerDetails'
import FinanceDashboard from './pages/finance/FinanceDashboard'
import CouponList from './pages/marketing/CouponList'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import SupportTickets from './pages/support/SupportTickets'
import SettingsPage from './pages/settings/SettingsPage'

const ProtectedRoute = ({ children }) => {
  return children
}

export const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Redirect /login and /forgot-password to /dashboard for direct access */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Admin Routes */}
              <Route
                path="/"
                element={
                  <AdminLayout />
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="restaurants" element={<RestaurantList />} />
                <Route path="restaurants/:id" element={<RestaurantDetails />} />
                <Route path="delivery-boys" element={<DeliveryBoyList />} />
                <Route path="delivery-boys/:id" element={<DeliveryBoyDetails />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="marketing" element={<CouponList />} />
                <Route path="reports" element={<ReportsDashboard />} />
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
