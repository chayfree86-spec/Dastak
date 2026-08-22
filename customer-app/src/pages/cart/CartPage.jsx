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

  const [showClearConfirm, setShowClearConfirm] = useState(false)

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
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-36 sm:pb-40">
      {/* 1. Premium & Designful Cart Header (Fixed directly below Top App Header) */}
      <div className="sticky top-14 sm:top-16 z-30 p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 transition-all -mt-1 sm:mt-0">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {t.yourCart}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-[#FF5200] dark:text-orange-400 text-[11px] font-black uppercase tracking-wide">
              {itemCount} {itemCount === 1 ? 'Dish' : 'Dishes'}
            </span>
          </div>

          {restaurant && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-bold max-w-full truncate">
              <Store className="w-3.5 h-3.5 text-[#FF5200] shrink-0" />
              <span className="truncate">
                From <strong className="text-slate-900 dark:text-white font-black">{restaurant.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Designful Clear Cart Button */}
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="shrink-0 px-3 sm:px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/90 dark:border-rose-800/60 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer group"
          title="Clear all cart items"
        >
          <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto shadow-xs border border-rose-200/60 dark:border-rose-900/40">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Clear all cart items?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                This will remove all dishes from your current order.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Items
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart()
                  setShowClearConfirm(false)
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main 2-Column Grid (Items Left, Bill Right on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
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
          </div>

          {/* Standalone '+ Add More Items' Card - Outside Items Card */}
          <div
            onClick={() =>
              restaurant?.slug
                ? navigate(`/restaurant/${restaurant.slug}`)
                : navigate('/restaurants')
            }
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-[#FF5200]/50 dark:border-orange-500/50 hover:border-[#FF5200] flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] group select-none"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5200] flex items-center justify-center font-black shadow-xs group-hover:scale-110 group-hover:bg-[#FF5200] group-hover:text-white transition-all shrink-0">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                  + Add More Items
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {restaurant?.name ? `From ${restaurant.name}` : 'Explore full menu'}
                </span>
              </div>
            </div>

            <span className="shrink-0 text-xs font-black text-[#FF5200] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-3 py-1.5 rounded-xl border border-orange-200/80 dark:border-orange-900/60 shadow-2xs group-hover:bg-[#FF5200] group-hover:text-white transition-all flex items-center gap-1">
              <span>Menu</span>
              <span>→</span>
            </span>
          </div>
        </div>

        {/* Right Column: Bill Details Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider text-xs sm:text-sm">
              <Receipt className="w-4 h-4 text-[#FF5200] dark:text-orange-400" />
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
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Checkout Bar in Footer (Safe Gap above Home Navigation Button) */}
      <div className="fixed bottom-20 sm:bottom-24 inset-x-3 sm:inset-x-6 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-3 duration-300">
        <div
          onClick={() => navigate('/checkout')}
          className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#FF5200] via-[#F97316] to-[#EA580C] text-white shadow-2xl shadow-orange-500/40 flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-white/90 block leading-tight">
                {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} • TOTAL
              </span>
              <div className="text-sm sm:text-base font-black leading-tight tracking-tight">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm bg-white text-slate-900 px-4 sm:px-5 py-2.5 rounded-2xl shadow-md shrink-0 active:scale-95 transition-transform">
            <span>{t.proceedToCheckout || 'Proceed to Checkout'}</span>
            <ArrowRight className="w-4 h-4 text-[#FF5200]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
