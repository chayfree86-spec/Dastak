import React, { useState, useEffect } from 'react'
import { Star, Clock, ArrowRight, Award, Store } from 'lucide-react'
import { apiClient } from '../../api/client'
import { APP_URLS } from '../../config/appUrls'

export const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await apiClient.get('/restaurants', { params: { per_page: 8 } })
        const data = res.data?.data || res.data || []
        // Map ONLY real backend fields — nothing fabricated.
        const mapped = (Array.isArray(data) ? data : [])
          .filter((r) => r.is_active !== false)
          .slice(0, 4)
          .map((r) => ({
            id: r.id,
            slug: r.slug || r.id,
            name: r.name,
            cuisine: r.description || r.city || '',
            rating: Number(r.rating) || 0,
            reviews: Number(r.total_ratings) || 0,
            time: r.preparation_time_minutes ? `${r.preparation_time_minutes} mins` : null,
            image: r.banner || r.logo || null,
            isPureVeg: Boolean(r.is_pure_veg),
            isOpen: r.is_open !== false,
          }))
        setRestaurants(mapped)
      } catch {
        setRestaurants([])
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurants()
  }, [])

  // Hide the whole section when there is no real data (no dummy filler).
  if (!loading && restaurants.length === 0) return null

  return (
    <section id="restaurants" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5200]">
              <Award className="w-4 h-4" />
              <span>Top Rated In Your Area</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#113BD0] dark:text-white tracking-tight mt-1">
              Featured Restaurants &amp; Kitchens
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              Freshly cooked meals prepared with strict hygiene standards and delivered in sealed safety packaging.
            </p>
          </div>

          <a
            href={APP_URLS.customer}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5200] hover:text-[#E04800] transition-colors group"
          >
            <span>Explore All Restaurants</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Restaurant Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((rest) => (
            <a
              key={rest.id}
              href={`${APP_URLS.customer}/restaurants/${rest.slug}`}
              className="group rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#FF5200]/40 transition-all duration-300 flex flex-col hover:-translate-y-1.5"
            >
              {/* Image / branded placeholder */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                {rest.image ? (
                  <img
                    src={rest.image}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#113BD0]/10 to-[#FF5200]/10 text-[#113BD0] dark:text-blue-400">
                    <Store className="w-10 h-10" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {rest.isPureVeg && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                    🌱 Pure Veg
                  </div>
                )}

                {rest.time && (
                  <div className="absolute bottom-3 left-3 text-white text-xs font-bold">
                    <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{rest.time}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate group-hover:text-[#FF5200] transition-colors">
                      {rest.name}
                    </h3>
                    {rest.rating > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0">
                        <Star className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400" />
                        <span>{rest.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {rest.cuisine && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {rest.cuisine}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] text-slate-400">
                    {rest.reviews > 0 ? `${rest.reviews} reviews` : (rest.isOpen ? 'Open now' : 'Closed')}
                  </span>
                  <span className="text-[#FF5200] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>View Menu</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedRestaurants
