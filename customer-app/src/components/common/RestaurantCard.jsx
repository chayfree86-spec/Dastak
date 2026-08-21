import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Clock, MapPin, Store, ShieldCheck, Tag } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Only the restaurant's REAL uploaded banner/logo — no stock/placeholder photos.
const getRestaurantBanner = (restaurant) => {
  const img = restaurant.banner || restaurant.logo
  if (img && !String(img).includes('placeholder')) return img
  return null
}

export const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  if (!restaurant) return null

  const isOpen = restaurant.is_open !== false
  const rating = Number(restaurant.rating) || 0
  const timeMin = Number(restaurant.preparation_time_minutes) || null
  const isPureVeg = Boolean(restaurant.is_pure_veg)
  const bannerUrl = getRestaurantBanner(restaurant)

  return (
    <article
      onClick={() => navigate(`/restaurant/${restaurant.slug || restaurant.id}`)}
      className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate(`/restaurant/${restaurant.slug || restaurant.id}`)
        }
      }}
      aria-label={`View restaurant: ${restaurant.name}${rating > 0 ? `, Rating: ${rating.toFixed(1)}` : ''}${timeMin ? `, Delivery in ${timeMin} to ${timeMin + 10} minutes` : ''}`}
    >
      {/* Banner Hero with Aspect Ratio */}
      <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={restaurant.name}
            width="360"
            height="202"
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#113BD0]/10 to-[#FF5200]/10 text-[#113BD0] dark:text-blue-400">
            <Store className="w-10 h-10" />
          </div>
        )}

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Status Badge: Open / Closed */}
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md whitespace-nowrap ${
              isOpen
                ? 'bg-emerald-600/90 text-white'
                : 'bg-rose-600/90 text-white'
            }`}
          >
            {isOpen ? t.openNow : t.closedNow}
          </span>

          {/* Pure Veg Tag */}
          {isPureVeg && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase shadow-md flex items-center gap-1 whitespace-nowrap">
              <span>🌱</span>
              <span>{t.vegOnly}</span>
            </span>
          )}
        </div>

        {/* Bottom Banner Info: Discount offer & Rating */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {restaurant.offer_text ? (
            <div className="flex items-center gap-1 bg-[#113BD0]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black shadow-md whitespace-nowrap">
              <Tag className="w-3 h-3 shrink-0" />
              <span>{restaurant.offer_text}</span>
            </div>
          ) : <span />}

          {rating > 0 && (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-md flex items-center gap-1 text-xs font-black text-slate-900 dark:text-slate-100 shrink-0 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Footer */}
      <div className="p-3.5 sm:p-4 space-y-2">
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-[#113BD0] dark:group-hover:text-blue-400 transition-colors truncate">
            {restaurant.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
            {restaurant.description || restaurant.address_line1 || restaurant.city || ''}
          </p>
        </div>

        {/* Meta Footer: Delivery Time & Location */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-bold gap-2">
          {timeMin ? (
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-[#113BD0] dark:text-blue-400 shrink-0" />
              <span>{timeMin}-{timeMin + 10} min</span>
            </div>
          ) : <span />}
          <div className="flex items-center gap-1.5 min-w-0 truncate justify-end">
            <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
            <span className="truncate">{restaurant.city || ''}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
