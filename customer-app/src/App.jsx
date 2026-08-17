import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'

import CustomerLayout from './components/layout/CustomerLayout'
import HomePage from './pages/home/HomePage'
import SearchPage from './pages/search/SearchPage'
import RestaurantsPage from './pages/restaurants/RestaurantsPage'
import RestaurantPage from './pages/restaurant/RestaurantPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderConfirmationPage from './pages/orders/OrderConfirmationPage'
import OrderTrackingPage from './pages/orders/OrderTrackingPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import MorePage from './pages/more/MorePage'
import AccountPage from './pages/account/AccountPage'
import SavedAddressesPage from './pages/addresses/SavedAddressesPage'
import LoginPage from './pages/auth/LoginPage'

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <ToastProvider>
                <BrowserRouter>
                  <Routes>
                    <Route element={<CustomerLayout />}>
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
                      <Route path="/addresses" element={<SavedAddressesPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
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
