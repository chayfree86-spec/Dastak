import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Store,
  ShieldCheck,
  Tag,
  Receipt,
  Bike,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import customerApi from '../../api/customer.api'
import { formatCurrency } from '../../utils/formatters'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import ActiveOrderBanner from '../../components/common/ActiveOrderBanner'

export const CartPage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const {
    items,
    restaurant,
    itemCount,
    subtotal,
    deliveryFee,
    taxAmount,
    grandTotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  const [activeOrder, setActiveOrder] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const loadActiveOrder = async () => {
      try {
        const res = await customerApi.getOrders({ status: 'active' })
        const list = res.data?.data || res.data || []
        const active = list.find(
          (o) =>
            o.status !== 'DELIVERED' &&
            o.status !== 'CANCELLED' &&
            o.status !== 'REJECTED'
        )
        setActiveOrder(active || null)
      } catch (e) {}
    }
    loadActiveOrder()
  }, [isAuthenticated])

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        {/* Active Order Card in Cart */}
        {activeOrder && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
              <Bike className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>LIVE ACTIVE ORDER</span>
            </div>
            <ActiveOrderBanner order={activeOrder} />
          </div>
        )}

        <EmptyState
          icon={ShoppingBag}
          title={t.cartEmpty}
          description={t.cartEmptySub}
          actionLabel={t.browseRestaurants}
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Active Order Card in Cart (if order is in progress) */}
      {activeOrder && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
            <Bike className="w-3.5 h-3.5 text-[#2845D6]" />
            <span>LIVE ACTIVE ORDER</span>
          </div>
          <ActiveOrderBanner order={activeOrder} />
        </div>
      )}
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t.yourCart}
          </h2>
          {restaurant && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[#2845D6]" />
              <span>Ordering from <strong>{restaurant.name}</strong></span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* 2. Items List */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
          >
            {/* Item Info */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm break-words leading-tight">
                {item.name}
              </h4>
              <p className="font-mono font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                {formatCurrency(item.price)} each
              </p>
            </div>

            {/* Quantity Pill Control */}
            <div className="flex items-center gap-2 xs:gap-3 shrink-0">
              <div className="py-1 px-1.5 rounded-xl bg-[#2845D6] text-white font-black text-xs shadow-md flex items-center justify-between gap-0.5 select-none min-h-[32px]">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-blue-700 rounded-md active:scale-90 transition-transform cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="font-mono text-xs sm:text-sm font-black px-1 min-w-[14px] text-center">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-blue-700 rounded-md active:scale-90 transition-transform cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>

              {/* Total for this line item */}
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 min-w-[50px] text-right">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bill Summary */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-black uppercase tracking-wider text-[10px]">
          <Receipt className="w-3.5 h-3.5" />
          <span>Bill Details</span>
        </div>

        <div className="space-y-2 text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>{t.itemTotal}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>{t.deliveryFee}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {deliveryFee === 0 ? (
                <span className="text-emerald-600 font-black">FREE</span>
              ) : (
                formatCurrency(deliveryFee)
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span>{t.taxes} (5% GST)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(taxAmount)}
            </span>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            <span>{t.grandTotal}</span>
            <span className="font-mono text-lg text-[#2845D6] dark:text-blue-400">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Checkout Action Button */}
      <Button
        variant="primary"
        size="xl"
        icon={ArrowRight}
        onClick={() => navigate('/checkout')}
        className="w-full shadow-xl shadow-blue-600/30 text-base font-black"
      >
        {t.proceedToCheckout} • {formatCurrency(grandTotal)}
      </Button>
    </div>
  )
}

export default CartPage
