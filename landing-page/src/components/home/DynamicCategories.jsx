import React, { useState, useEffect } from 'react'
import { ArrowRight, Flame } from 'lucide-react'
import { apiClient } from '../../api/client'
import { APP_URLS } from '../../config/appUrls'

const DEFAULT_CATEGORIES = [
  { id: 'biryani', name: 'Biryani & Rice', icon: '🍚', count: '45+ Varieties', color: 'from-amber-500/10 to-orange-500/20' },
  { id: 'pizza', name: 'Pizzas & Italian', icon: '🍕', count: '30+ Outlets', color: 'from-rose-500/10 to-orange-500/20' },
  { id: 'burgers', name: 'Burgers & Fries', icon: '🍔', count: '28+ Brands', color: 'from-amber-500/10 to-yellow-500/20' },
  { id: 'rolls', name: 'Kathi Rolls & Wraps', icon: '🌯', count: '35+ Varieties', color: 'from-emerald-500/10 to-teal-500/20' },
  { id: 'thali', name: 'North Indian Thali', icon: '🍲', count: '50+ Kitchens', color: 'from-orange-500/10 to-amber-500/20' },
  { id: 'chinese', name: 'Chinese & Noodles', icon: '🍜', count: '40+ Outlets', color: 'from-red-500/10 to-pink-500/20' },
  { id: 'desserts', name: 'Ice Creams & Sweets', icon: '🍨', count: '22+ Shops', color: 'from-pink-500/10 to-purple-500/20' },
  { id: 'beverages', name: 'Chai & Cold Drinks', icon: '☕', count: '30+ Cafes', color: 'from-blue-500/10 to-indigo-500/20' },
]

export const DynamicCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/categories')
        const data = res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          // Merge API categories
          const mapped = data.slice(0, 8).map((cat, idx) => ({
            id: cat.id || cat.slug || idx,
            name: cat.name || cat.title,
            icon: cat.icon || cat.image || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].icon,
            count: `${cat.items_count || (20 + idx * 4)}+ Items`,
            color: DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].color,
          }))
          setCategories(mapped)
        }
      } catch {
        // Fallback to rich defaults
      }
    }
    fetchCategories()
  }, [])

  return (
    <section id="categories" className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF5200]">
              <Flame className="w-4 h-4" />
              <span>Explore Flavors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#113BD0] dark:text-white tracking-tight mt-1">
              Popular Food Categories
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              From sizzling hot curries to quick gourmet bites, find exactly what you crave in seconds.
            </p>
          </div>

          <a
            href={APP_URLS.customer}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#FF5200] hover:text-[#E04800] transition-colors group"
          >
            <span>See All Cuisines</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`${APP_URLS.customer}?category=${encodeURIComponent(cat.id)}`}
              className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#FF5200]/40 transition-all duration-300 flex flex-col items-center text-center space-y-3 hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-800 dark:to-slate-750 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                {typeof cat.icon === 'string' && cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt={cat.name} className="w-10 h-10 object-contain" />
                ) : (
                  <span>{cat.icon}</span>
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-[#FF5200] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {cat.count}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DynamicCategories
