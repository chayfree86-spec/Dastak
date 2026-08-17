import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Banknote,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
  Store,
  FileText,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { useLocationContext } from '../../context/LocationContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import customerApi from '../../api/customer.api'
import { formatCurrency } from '../../utils/formatters'
import Button from '../../components/common/Button'
import LocationPickerModal from '../../components/common/LocationPickerModal'

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const toast = useToast()
  const { items, restaurant, subtotal, deliveryFee, taxAmount, grandTotal, clearCart } =
    useCart()
  const { activeAddress } = useLocationContext()
  const { isAuthenticated, user } = useAuth()

  const [paymentMode, setPaymentMode] = useState('COD') // 'COD' | 'ONLINE'
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const handlePlaceOrder = async (e) => {
    e?.preventDefault()
    setError('')

    // If not authenticated, prompt login
    if (!isAuthenticated) {
      toast.info('Login Required', 'Please sign in with your mobile number to place order.')
      navigate('/login?redirect=/checkout')
      return
    }

    if (!activeAddress || !activeAddress.address) {
      setError('Please select or add a delivery address.')
      setLocationModalOpen(true)
      return
    }

    setLoading(true)
    try {
      const payload = {
        restaurant_id: restaurant?.id || items[0]?.restaurant?.id || 1,
        items: items.map((it) => ({
          menu_item_id: it.id,
          quantity: it.quantity,
        })),
        delivery_address_json: {
          customer_name: activeAddress.customer_name || user?.name || 'Customer',
          customer_phone: activeAddress.customer_phone || user?.mobile || '9666600001',
          address: activeAddress.address,
          landmark: activeAddress.landmark || '',
          latitude: activeAddress.latitude || 26.456,
          longitude: activeAddress.longitude || 80.339,
        },
        payment_mode: paymentMode,
        special_instructions: specialInstructions,
      }

      const res = await customerApi.checkout(payload)
      const order = res.data?.order || res.data || {}

      toast.success(
        'Order Placed Successfully!',
        `Order #${order.order_number || 'New'} is being sent to kitchen.`
      )
      clearCart()
      navigate(`/orders/${order.order_number}`)
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t.checkout}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review your address and payment option to complete order
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-4">
        {/* 1. Delivery Address Selection Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>{t.deliveryAddress}</span>
            </span>

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="text-xs font-bold text-[#2845D6] dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t.changeLocation}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {activeAddress?.customer_name || user?.name || 'Valued Customer'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeAddress?.address || 'Civil Lines, Kanpur'}
            </p>
            {activeAddress?.landmark && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block">
                🚩 Landmark: {activeAddress.landmark}
              </span>
            )}
          </div>
        </div>

        {/* 2. Delivery Instructions */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Delivery Instructions (Optional)</span>
          </span>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Ring doorbell, leave at gate, keep extra napkins"
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2845D6]"
          />
        </div>

        {/* 3. Payment Method Selection */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <span className="text-[10px] font-black uppercase text-slate-400 block">
            {t.paymentMethod}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* COD Option */}
            <div
              onClick={() => setPaymentMode('COD')}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                paymentMode === 'COD'
                  ? 'bg-amber-50/70 dark:bg-slate-800 border-amber-500 ring-2 ring-amber-500/15'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="font-black text-slate-900 dark:text-slate-100">
                  {t.cashOnDelivery}
                </h5>
                <p className="text-[11px] text-slate-400">Pay cash upon delivery</p>
              </div>
            </div>

            {/* Online Payment Option */}
            <div
              onClick={() => setPaymentMode('ONLINE')}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                paymentMode === 'ONLINE'
                  ? 'bg-blue-50/70 dark:bg-slate-800 border-[#2845D6] ring-2 ring-blue-500/15'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#2845D6] text-white flex items-center justify-center font-black shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="font-black text-slate-900 dark:text-slate-100">
                  {t.onlinePayment}
                </h5>
                <p className="text-[11px] text-slate-400">UPI, Cards, Netbanking</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Order Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block">
              TOTAL TO PAY
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(grandTotal)}
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? 'Dish' : 'Dishes'}
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 5. Place Order Button */}
        <Button
          type="submit"
          variant="accent"
          size="xl"
          icon={CheckCircle2}
          loading={loading}
          className="w-full shadow-xl shadow-orange-500/30 text-base font-black"
        >
          {loading ? t.placingOrder : `${t.placeOrder} • ${formatCurrency(grandTotal)}`}
        </Button>
      </form>

      {/* Location Modal */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  )
}

export default CheckoutPage
