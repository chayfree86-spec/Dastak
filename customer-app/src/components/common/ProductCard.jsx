import React from 'react'
import { Plus, Minus, Star, Flame, Sparkles, Utensils } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useCart } from '../../context/CartContext'

// Fallback high quality food photography placeholders based on food name
const getFoodImage = (product) => {
  if (product.image && !product.image.includes('placeholder')) {
    return product.image
  }
  const name = (product.name || '').toLowerCase()
  if (name.includes('biryani') || name.includes('rice')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('chai') || name.includes('tea') || name.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('burger') || name.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('samosa') || name.includes('snack') || name.includes('chaat')) {
    return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('paneer') || name.includes('curry') || name.includes('dal')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80'
  }
  if (name.includes('sweet') || name.includes('jalebi') || name.includes('cake') || name.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80'
  }
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80'
}

export const ProductCard = ({ product, customRestaurant = null, onSelect }) => {
  const { getItemQuantity, addItem, updateQuantity } = useCart()

  if (!product) return null

  const currentQty = getItemQuantity(product.id)
  const isAvailable = product.is_available !== false
  const price = Number(product.discount_price || product.base_price || 0)
  const originalPrice = Number(product.base_price || 0)
  const isVeg = product.food_type === 'VEG' || product.food_type === 'pure_veg'
  const restaurantName = product.restaurant?.name || customRestaurant?.name
  const imageUrl = getFoodImage(product)

  const handleAdd = (e) => {
    e?.stopPropagation()
    if (!isAvailable) return
    addItem(product, 1, customRestaurant)
  }

  const handleIncrement = (e) => {
    e?.stopPropagation()
    if (!isAvailable) return
    updateQuantity(product.id, currentQty + 1)
  }

  const handleDecrement = (e) => {
    e?.stopPropagation()
    updateQuantity(product.id, currentQty - 1)
  }

  const discountPercent =
    product.discount_price && originalPrice > product.discount_price
      ? Math.round(((originalPrice - product.discount_price) / originalPrice) * 100)
      : null

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between gap-3 ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3.5">
        {/* Left Food Info */}
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Badges: Veg/NonVeg + Bestseller / Restaurant */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Veg / Non-Veg Indicator */}
            <span
              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                isVeg
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-rose-600 bg-rose-50 dark:bg-rose-950/40'
              }`}
              title={isVeg ? 'Pure Veg' : 'Non-Veg'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>

            {/* Bestseller Tag */}
            {product.is_featured ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Bestseller</span>
              </span>
            ) : restaurantName ? (
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                {restaurantName}
              </span>
            ) : null}
          </div>

          {/* Product Name */}
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-[#2845D6] dark:group-hover:text-blue-400 transition-colors leading-snug">
            {product.name}
          </h4>

          {/* Price & Discount */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrency(price)}
            </span>
            {discountPercent && (
              <>
                <span className="text-xs text-slate-400 line-through font-mono">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
              {product.description}
            </p>
          )}
        </div>

        {/* Right Thumbnail & ADD / Quantity Controller */}
        <div className="relative flex flex-col items-center shrink-0">
          <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-inner relative group-hover:scale-102 transition-transform duration-300">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80'
              }}
            />
          </div>

          {/* Tactile Add / Quantity Pill (Min 34px Touch Target) */}
          <div className="absolute -bottom-3.5 inset-x-0 xs:inset-x-1">
            {!isAvailable ? (
              <span className="w-full py-1 px-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase text-center block shadow-xs">
                Sold Out
              </span>
            ) : currentQty === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                className="w-full min-h-[34px] py-1.5 px-2 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#2845D6] dark:border-blue-500 text-[#2845D6] dark:text-blue-400 hover:bg-[#2845D6] hover:text-white dark:hover:bg-[#2845D6] dark:hover:text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>ADD</span>
              </button>
            ) : (
              <div className="w-full min-h-[34px] py-1 px-1 rounded-2xl bg-gradient-to-r from-[#2845D6] to-blue-700 text-white font-black text-xs shadow-xl shadow-blue-600/30 flex items-center justify-between gap-0.5 select-none">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/25 rounded-lg active:scale-90 transition-transform cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="font-mono text-xs sm:text-sm font-black px-1 min-w-[16px] text-center">
                  {currentQty}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/25 rounded-lg active:scale-90 transition-transform cursor-pointer"
                  title="Increase"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
