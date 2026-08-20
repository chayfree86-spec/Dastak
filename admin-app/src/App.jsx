import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'

import AdminLayout from './components/layout/AdminLayout'

// Every route below is its own JS chunk (code-split), so a visitor only
// downloads the page they're actually viewing — critical on slow connections.
const Login = lazy(() => import('./pages/auth/Login'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const RestaurantList = lazy(() => import('./pages/restaurants/RestaurantList'))
const RestaurantDetails = lazy(() => import('./pages/restaurants/RestaurantDetails'))
const OrderList = lazy(() => import('./pages/orders/OrderList'))
const DeliveryBoyList = lazy(() => import('./pages/deliveryBoys/DeliveryBoyList'))
const DeliveryBoyDetails = lazy(() => import('./pages/deliveryBoys/DeliveryBoyDetails'))
const DeliveryBoyIdCard = lazy(() => import('./pages/deliveryBoys/DeliveryBoyIdCard'))
const CustomerList = lazy(() => import('./pages/customers/CustomerList'))
const CustomerDetails = lazy(() => import('./pages/customers/CustomerDetails'))
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'))
const CouponList = lazy(() => import('./pages/marketing/CouponList'))
const FoodCategoriesPage = lazy(() => import('./pages/marketing/FoodCategoriesPage'))
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'))
const SupportTickets = lazy(() => import('./pages/support/SupportTickets'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const SystemLogDashboard = lazy(() => import('./pages/systemLog/SystemLogDashboard'))

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

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B132B]">
    <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-700 border-t-[#2845D6] rounded-full animate-spin" />
  </div>
)

export const App = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <PwaController />
            <Suspense fallback={<RouteLoader />}>
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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
