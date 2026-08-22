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
  const { t, lang } = useLanguage()
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

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6 pb-28">
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
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t.yourCart}
          </h2>
          {restaurant && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#113BD0]" />
              <span>Ordering from <strong>{restaurant.name}</strong></span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* 2. Main 2-Column Grid (Items Left, Bill Right on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Items List Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const isVeg = item.food_type === 'VEG' || item.food_type === 'pure_veg'

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    {/* Item Info & Veg Badge */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Food Type Indicator Icon */}
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                          isVeg
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-rose-500 bg-rose-500/10'
                        }`}
                        title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </span>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className="font-black text-slate-900 dark:text-slate-50 text-sm sm:text-base break-words leading-snug">
                          {item.name}
                        </h4>
                        <p className="font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                          {formatCurrency(item.price)} {lang === 'hi' ? 'प्रति' : 'each'}
                        </p>
                      </div>
                    </div>

                    {/* Right Controls: Stepper, Item Total & Dedicated Delete Button */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="py-1 px-2 rounded-xl bg-[#FF5200] dark:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-between gap-1 select-none min-h-[34px] sm:min-h-[38px]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#E04800] rounded-md active:scale-90 transition-transform cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span className="text-xs sm:text-base font-black px-1 min-w-[18px] sm:min-w-[22px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-[#E04800] rounded-md active:scale-90 transition-transform cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>

                      {/* Line Total Highlight Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shrink-0">
                        <span className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Dedicated Delete Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete item from cart"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add More Items Button */}
            <button
              type="button"
              onClick={() =>
                restaurant?.slug
                  ? navigate(`/restaurant/${restaurant.slug}`)
                  : navigate('/restaurants')
              }
              className="w-full py-3 px-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-[#113BD0] dark:text-blue-400 text-xs sm:text-sm font-black border border-dashed border-[#113BD0]/30 dark:border-blue-500/40 flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>Add More Items</span>
              </span>
              <span className="text-xs font-bold text-slate-400 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 transition-colors">
                {restaurant?.name ? `From ${restaurant.name} →` : 'Browse Menu →'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Bill Details & Checkout Button */}
        <div className="lg:col-span-1 space-y-4 sticky top-20">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider text-xs sm:text-sm">
              <Receipt className="w-4 h-4 text-[#113BD0] dark:text-blue-400" />
              <span>BILL DETAILS</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300">{t.itemTotal}</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300">{t.deliveryFee}</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg text-xs tracking-wide">
                      FREE
                    </span>
                  ) : (
                    <span className="text-base font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(deliveryFee)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300">{t.taxes} (5% GST)</span>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(taxAmount)}
                </span>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  {t.grandTotal}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#FF5200] dark:text-orange-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 shadow-xl shadow-orange-500/30 text-sm sm:text-base font-black mt-2"
            >
              {t.proceedToCheckout}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
