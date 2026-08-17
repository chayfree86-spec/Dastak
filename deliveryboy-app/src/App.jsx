import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DeliveryLayout from './components/layout/DeliveryLayout'
import LoginPage from './pages/auth/LoginPage'
import HomePage from './pages/home/HomePage'
import DeliveriesPage from './pages/deliveries/DeliveriesPage'
import EarningsPage from './pages/earnings/EarningsPage'
import CodCollectionPage from './pages/cod/CodCollectionPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import MoreMenuPage from './pages/more/MoreMenuPage'
import LoadingSkeleton from './components/common/LoadingSkeleton'

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DeliveryLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="cod" element={<CodCollectionPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="more" element={<MoreMenuPage />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
