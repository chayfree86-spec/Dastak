import React, { useState, useEffect } from 'react'
import { Star, Clock, Tag, ArrowRight, Award } from 'lucide-react'
import { apiClient } from '../../api/client'
import { APP_URLS } from '../../config/appUrls'

const DEFAULT_RESTAURANTS = [
  {
    id: 1,
    name: 'Biryani Central',
    cuisine: 'Awadhi & Dum Biryani',
    rating: 4.8,
    reviews: '1.2k+',
    time: '18-22 mins',
    priceForTwo: '₹350 for two',
    discount: '50% OFF up to ₹100',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    isPureVeg: false,
    featured: true,
  },
  {
    id: 2,
    name: 'Royal Spice Kitchen',
    cuisine: 'North Indian, Mughlai & Rolls',
    rating: 4.7,
    reviews: '850+',
    time: '20-25 mins',
    priceForTwo: '₹400 for two',
    discount: 'FLAT ₹75 OFF',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
    isPureVeg: false,
    featured: true,
  },
  {
    id: 3,
    name: 'Punjabi Tadka Express',
    cuisine: 'Punjabi, Paneer Specials & Breads',
    rating: 4.6,
    reviews: '2.1k+',
    time: '15-20 mins',
    priceForTwo: '₹300 for two',
    discount: 'FREE DELIVERY',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    isPureVeg: true,
    featured: true,
  },
  {
    id: 4,
    name: 'South Express Cafe',
    cuisine: 'Dosa, Idli, Vada & Filter Coffee',
    rating: 4.9,
    reviews: '3.4k+',
    time: '15-18 mins',
    priceForTwo: '₹250 for two',
    discount: '20% OFF',
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    isPureVeg: true,
    featured: true,
  },
]

export const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState(DEFAULT_RESTAURANTS)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await apiClient.get('/restaurants/featured')
        const data = res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r, idx) => ({
            id: r.id || idx + 1,
            name: r.name || 'Partner Kitchen',
            cuisine: r.cuisine_types || r.cuisines || 'Multi-Cuisine',
            rating: Number(r.rating || 4.7).toFixed(1),
            reviews: `${r.reviews_count || (150 + idx * 80)}+`,
            time: `${r.delivery_time_mins || 20} mins`,
            priceForTwo: `₹${r.cost_for_two || 350} for two`,
            discount: r.active_discount || (idx % 2 === 0 ? '50% OFF up to ₹100' : 'FLAT ₹75 OFF'),
            image: r.banner_url || r.logo_url || DEFAULT_RESTAURANTS[idx % DEFAULT_RESTAURANTS.length].image,
            isPureVeg: Boolean(r.is_pure_veg),
            featured: true,
          }))
          setRestaurants(mapped)
        }
      } catch {
        // Fallback to rich defaults
      }
    }
    fetchRestaurants()
  }, [])

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
              href={`${APP_URLS.customer}/restaurants/${rest.id}`}
              className="group rounded-3xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#FF5200]/40 transition-all duration-300 flex flex-col hover:-translate-y-1.5"
            >
              {/* Image Container with Badges */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img
                  src={rest.image}
                  alt={rest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = DEFAULT_RESTAURANTS[0].image
                  }}
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Discount Tag */}
                {rest.discount && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#FF5200] text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{rest.discount}</span>
                  </div>
                )}

                {/* Pure Veg Badge */}
                {rest.isPureVeg && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-md">
                    🌱 Pure Veg
                  </div>
                )}

                {/* Delivery Time & Price on Image Bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{rest.time}</span>
                  </span>
                  <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                    {rest.priceForTwo}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white truncate group-hover:text-[#FF5200] transition-colors">
                      {rest.name}
                    </h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0">
                      <Star className="w-3 h-3 fill-emerald-600 dark:fill-emerald-400" />
                      <span>{rest.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {rest.cuisine}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] text-slate-400">{rest.reviews} reviews</span>
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
