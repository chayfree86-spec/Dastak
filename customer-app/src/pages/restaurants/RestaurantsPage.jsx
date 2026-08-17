import React, { useState, useEffect } from 'react'
import {
  Store,
  Search,
  X,
  Star,
  Clock,
  MapPin,
  Leaf,
  Filter,
  Flame,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import restaurantApi from '../../api/restaurant.api'
import RestaurantCard from '../../components/common/RestaurantCard'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'

export const RestaurantsPage = () => {
  const { t } = useLanguage()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'veg' | 'rating' | 'fast'

  useEffect(() => {
    const loadRestaurants = async () => {
      setLoading(true)
      try {
        const res = await restaurantApi.getRestaurants({ per_page: 20 })
        setRestaurants(res.data?.data || res.data || [])
      } catch (e) {
        console.warn('Failed to load restaurants:', e)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (rest.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.address_line1 || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'veg') return Boolean(rest.is_pure_veg)
    if (filter === 'rating') return (Number(rest.rating) || 4.8) >= 4.5
    if (filter === 'fast') return (rest.preparation_time_minutes || 30) <= 25

    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-[#2845D6] dark:text-blue-400" />
          <span>All Partner Restaurants</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Explore verified cloud kitchens, dhabas, and top dining outlets in your city
        </p>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 -my-1 scrollbar-none text-xs font-black">
        {[
          { id: 'all', label: `All Kitchens (${restaurants.length})` },
          { id: 'rating', label: '★ 4.5+ Top Rated' },
          { id: 'veg', label: '🌱 Pure Veg Only' },
          { id: 'fast', label: '⚡ Fast Delivery (< 25 min)' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-4 py-2 rounded-2xl transition-all shrink-0 cursor-pointer ${
              filter === item.id
                ? 'bg-[#2845D6] text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRestaurants.map((rest) => (
            <RestaurantCard key={rest.id} restaurant={rest} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No Restaurants Found"
          description="Try changing your search keywords or filter selection."
        />
      )}

      {/* Sticky Floating Search Bar in Footer Zone */}
      <div className="fixed bottom-20 inset-x-3 max-w-md mx-auto z-30">
        <div className="p-2 sm:p-2.5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-[#2845D6] dark:border-blue-500 shadow-2xl flex items-center gap-2">
          <Search className="w-4 h-4 text-[#2845D6] dark:text-blue-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by restaurant name or cuisine..."
            className="w-full py-1 text-xs sm:text-sm font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestaurantsPage
