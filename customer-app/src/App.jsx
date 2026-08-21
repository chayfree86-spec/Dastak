import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'

import CustomerLayout from './components/layout/CustomerLayout'
import HomePage from './pages/home/HomePage'

// Lazy load non-homepage routes for instant FCP and 100% Performance
const SearchPage = lazy(() => import('./pages/search/SearchPage'))
const RestaurantsPage = lazy(() => import('./pages/restaurants/RestaurantsPage'))
const RestaurantPage = lazy(() => import('./pages/restaurant/RestaurantPage'))
const CartPage = lazy(() => import('./pages/cart/CartPage'))
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const OrderConfirmationPage = lazy(() => import('./pages/orders/OrderConfirmationPage'))
const OrderTrackingPage = lazy(() => import('./pages/orders/OrderTrackingPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const MorePage = lazy(() => import('./pages/more/MorePage'))
const AccountPage = lazy(() => import('./pages/account/AccountPage'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage'))
const SavedAddressesPage = lazy(() => import('./pages/addresses/SavedAddressesPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))

import { PwaInstallModal } from './components/pwa/PwaInstallModal'
import { usePwaUpdate } from './hooks/usePwaUpdate'
import AuthGuard from './components/auth/AuthGuard'

const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

const PwaController = () => {
  usePwaUpdate()
  return (
    <PwaInstallModal
      appName="Dastak Food & Grocery"
      appRole="Food, Grocery & Essentials in 10-20 Mins"
      iconSrc="/pwa-512x512.png"
      accentColor="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
      accentBadge="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    />
  )
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <ToastProvider>
                <BrowserRouter>
                  <PwaController />
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route
                        element={
                          <AuthGuard>
                            <CustomerLayout />
                          </AuthGuard>
                        }
                      >
                        <Route path="/" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/restaurants" element={<RestaurantsPage />} />
                        <Route path="/restaurant/:slug" element={<RestaurantPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/orders/:orderNumber/confirmation" element={<OrderConfirmationPage />} />
                        <Route path="/orders/:orderNumber" element={<OrderTrackingPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/more" element={<MorePage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/addresses" element={<SavedAddressesPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </ToastProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
