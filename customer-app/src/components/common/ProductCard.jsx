import React, { useState } from 'react'
import { Plus, Minus, Star, Flame, UtensilsCrossed } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'

export const ProductCard = ({ product, customRestaurant = null, onSelect }) => {
  const { t } = useLanguage()
  const { getItemQuantity, addItem, updateQuantity } = useCart()
  const [imageFailed, setImageFailed] = useState(false)

  if (!product) return null

  const currentQty = getItemQuantity(product.id)
  const isAvailable = product.is_available !== false
  const price = Number(product.discount_price || product.base_price || 0)
  const originalPrice = Number(product.base_price || 0)
  const isVeg = product.food_type === 'VEG' || product.food_type === 'pure_veg'
  const restaurantName = product.restaurant?.name || customRestaurant?.name
  const rawImage = product?.image && typeof product.image === 'string' ? product.image.trim() : ''
  const hasImage = Boolean(
    rawImage &&
    !imageFailed &&
    !rawImage.includes('placeholder') &&
    !rawImage.includes('default') &&
    !rawImage.endsWith('.svg')
  )

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
    <article
      onClick={onSelect}
      className={`group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-all duration-300 h-56 sm:h-64 w-full select-none bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 ${
        onSelect ? 'cursor-pointer' : ''
      }`}
      aria-label={`${product.name} - ${formatCurrency(price)}`}
    >
      {/* 1. Real Item Image (Only if uploaded by Merchant) */}
      {hasImage ? (
        <>
          <img
            src={rawImage}
            alt={product.name}
            width="360"
            height="240"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-all duration-500 pointer-events-none"
            onError={() => setImageFailed(true)}
          />
          {/* Multi-Stop Gradient Overlay for Crisp Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 pointer-events-none" />
        </>
      ) : (
        /* Minimalist & Modern Graphic Card Background when no image is uploaded */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
          {/* Watermark Food Icon */}
          <UtensilsCrossed className="w-24 h-24 text-white/[0.04] transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}

      {/* 2. Top Floating Badges (Veg/NonVeg, Bestseller, Rating, Restaurant) */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Veg / Non-Veg Indicator */}
          <span
            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md ${
              isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
            title={isVeg ? 'Pure Veg' : 'Non-Veg'}
            aria-label={isVeg ? 'Pure Veg' : 'Non-Veg'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>

          {/* Bestseller Tag */}
          {product.is_featured && (
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white text-white" />
              <span>{t.bestseller || 'Bestseller'}</span>
            </span>
          )}

          {restaurantName && !product.is_featured && (
            <span className="px-2.5 py-0.5 rounded-lg bg-black/50 text-white text-[10px] font-bold backdrop-blur-md truncate max-w-[140px] border border-white/10">
              {restaurantName}
            </span>
          )}
        </div>

        {/* Rating & Discount Pill */}
        <div className="flex items-center gap-1.5">
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-lg bg-[#FF5200] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              {discountPercent}% OFF
            </span>
          )}

          {product.rating && (
            <div className="flex items-center gap-1 text-[11px] font-black text-white bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20 shadow-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{Number(product.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Content (Name, Description, Price & ADD Controller) */}
      <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 flex items-end justify-between gap-3 z-10">
        {/* Left: Dish Name, Description, and Price */}
        <div className="space-y-1 min-w-0 flex-1 text-white pr-2">
          <h3 className="text-base sm:text-lg font-black tracking-tight line-clamp-1 drop-shadow-md leading-tight text-white group-hover:text-amber-300 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-[11px] text-white/80 line-clamp-1 font-medium drop-shadow-xs leading-tight">
              {product.description}
            </p>
          )}

          {/* Price Strip */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-lg sm:text-2xl font-black text-white drop-shadow-md">
              {formatCurrency(price)}
            </span>
            {discountPercent && (
              <span className="text-xs text-white/70 line-through font-medium">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Right: Tactile Floating ADD / Quantity Controller Button */}
        <div className="shrink-0">
          {!isAvailable ? (
            <span className="px-3 py-2 rounded-2xl bg-black/75 backdrop-blur-md text-slate-300 text-xs font-black uppercase shadow-md border border-white/20 block">
              {t.soldOut || 'Sold Out'}
            </span>
          ) : currentQty === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className="min-h-[40px] px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF5200] to-[#EA580C] hover:from-[#E04800] hover:to-[#C2410C] text-white font-black text-xs uppercase tracking-wider shadow-2xl shadow-black/50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/25"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.add || 'ADD'}</span>
            </button>
          ) : (
            <div className="min-h-[40px] px-2 py-1 rounded-2xl bg-gradient-to-r from-[#FF5200] to-[#EA580C] text-white font-black text-xs shadow-2xl shadow-black/60 flex items-center justify-between gap-2 select-none border border-white/25 backdrop-blur-md">
              <button
                type="button"
                onClick={handleDecrement}
                aria-label={`Decrease quantity of ${product.name}`}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/25 rounded-xl active:scale-90 transition-transform cursor-pointer"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span
                className="text-xs sm:text-sm font-black px-1 min-w-[18px] text-center drop-shadow-sm"
                aria-label={`Current quantity: ${currentQty}`}
              >
                {currentQty}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label={`Increase quantity of ${product.name}`}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/25 rounded-xl active:scale-90 transition-transform cursor-pointer"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
